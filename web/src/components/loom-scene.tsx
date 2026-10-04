"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { authorityPath, statusOf } from "@/lib/authority";
import { operationalPoints } from "./flat-authority-tree";
import type { LoomProps } from "./spatial-loom";

type V3 = [number, number, number];
// LTC tables are initialized once in the lazy scene chunk, never on a render tick.
RectAreaLightUniformsLib.init();
type Chamber = {
  position: V3;
  width: number;
  height: number;
  depth: number;
  label: V3;
};
const chambers: Record<string, Chamber> = {
  treasury: {
    position: [4.2, 3.9, 2],
    width: 9.0,
    height: 4.8,
    depth: 1.7,
    label: [3.6, 7.3, 3.8],
  },
  research: {
    position: [2.1, 2.6, -1.1],
    width: 5.8,
    height: 3.7,
    depth: 1.35,
    label: [-0.9, 4.8, -0.5],
  },
  operations: {
    position: [8.7, 2.7, 0.4],
    width: 3.0,
    height: 4.1,
    depth: 1.2,
    label: [9.9, 5.1, 1],
  },
  data: {
    position: [1.3, 1.8, -4.4],
    width: 3.9,
    height: 2.6,
    depth: 1.15,
    label: [-1, 2.8, -3.4],
  },
  analysis: {
    position: [4.1, 1.4, -4.1],
    width: 2.1,
    height: 2.1,
    depth: 1.1,
    label: [4.7, 2.5, -2.9],
  },
  scraper: {
    position: [1.15, 1.15, -7.5],
    width: 2.5,
    height: 1.65,
    depth: 0.85,
    label: [1.3, 2.5, -6.7],
  },
};
const mint = new THREE.Color("#b9efdb"),
  copper = new THREE.Color("#f2a46d"),
  brass = new THREE.Color("#ecc28a");
function frameGeometry(w: number, h: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();
  const t = 0.22,
    hole = new THREE.Path();
  hole.moveTo(-w / 2 + t, -h / 2 + t);
  hole.lineTo(-w / 2 + t, h / 2 - t);
  hole.lineTo(w / 2 - t, h / 2 - t);
  hole.lineTo(w / 2 - t, -h / 2 + t);
  hole.closePath();
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.028,
    bevelThickness: 0.028,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 1,
  });
}
function rail(points: V3[]) {
  const vectors = points.map((p) => new THREE.Vector3(...p));
  const path = new THREE.CurvePath<THREE.Vector3>();
  let previous = vectors[0];
  for (let i = 1; i < vectors.length - 1; i++) {
    const corner = vectors[i],
      radius = Math.min(
        0.18,
        corner.distanceTo(vectors[i - 1]) * 0.2,
        corner.distanceTo(vectors[i + 1]) * 0.2,
      );
    const before = corner
      .clone()
      .add(
        vectors[i - 1].clone().sub(corner).normalize().multiplyScalar(radius),
      );
    const after = corner
      .clone()
      .add(
        vectors[i + 1].clone().sub(corner).normalize().multiplyScalar(radius),
      );
    path.add(new THREE.LineCurve3(previous, before));
    path.add(new THREE.QuadraticBezierCurve3(before, corner, after));
    previous = after;
  }
  path.add(new THREE.LineCurve3(previous, vectors.at(-1)!));
  return path;
}
function railMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uColor: { value: color.clone() },
      uLit: { value: 1 },
      uGrow: { value: 1 },
      uPulse: { value: -1 },
    },
    vertexShader:
      "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "varying vec2 vUv;uniform vec3 uColor;uniform float uLit;uniform float uGrow;uniform float uPulse;void main(){float grown=1.0-step(uGrow,vUv.x);float pulse=(1.0-smoothstep(0.0,0.055,abs(vUv.x-uPulse)))*step(0.0,uPulse);vec3 base=mix(vec3(0.095,0.12,0.115),uColor,uLit*grown);gl_FragColor=vec4(base+vec3(0.8)*pulse*uLit*grown,1.0);}",
  });
}
function metalMaterial(background = false) {
  // Small procedural height field: no downloaded/raster target is used as material.
  const hash = (x: number, y: number) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const noise = (x: number, y: number) => {
    const a = Math.floor(x),
      b = Math.floor(y);
    const u = x - a,
      v = y - b;
    const sx = u * u * (3 - 2 * u),
      sy = v * v * (3 - 2 * v);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(hash(a, b), hash(a + 1, b), sx),
      THREE.MathUtils.lerp(hash(a, b + 1), hash(a + 1, b + 1), sx),
      sy,
    );
  };
  const pixels = new Uint8Array(128 * 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      pixels[y * 128 + x] = Math.round(
        255 *
          (noise(x / 11, y / 11) * 0.5 +
            noise(x / 3, y / 3) * 0.3 +
            hash(x, y) * 0.2),
      );
    }
  const relief = new THREE.DataTexture(pixels, 128, 128, THREE.RedFormat);
  relief.wrapS = relief.wrapT = THREE.RepeatWrapping;
  relief.magFilter = THREE.LinearFilter;
  relief.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    color: background ? "#1d2321" : "#424844",
    roughness: background ? 0.72 : 0.46,
    metalness: background ? 0.12 : 0.28,
    bumpMap: relief,
    bumpScale: background ? 0.009 : 0.038,
  });
  material.addEventListener("dispose", () => relief.dispose());
  // Fine procedural ceramic variation belongs to the mesh, never a UI overlay.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vStone;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvStone=position;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vStone;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\nfloat n=fract(sin(dot(floor(vStone*145.0),vec3(12.9898,78.233,33.719)))*43758.5453);diffuseColor.rgb*=0.88+n*0.12;",
      );
  };
  return material;
}
function Environment() {
  const { gl, scene } = useThree();
  const material = useMemo(() => metalMaterial(true), []);
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl),
      room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04, 0.1, 100);
    /* eslint-disable react-hooks/immutability -- R3F owns this mutable Three.js scene, not React application state. */
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.28;
    generator.dispose();
    room.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
    /* eslint-enable react-hooks/immutability */
  }, [gl, scene]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group>
      <color attach="background" args={["#101415"]} />
      <fog attach="fog" args={["#101415", 26, 65]} />
      <hemisphereLight args={["#b9c9ce", "#151814", 0.14]} />
      <rectAreaLight
        position={[-6, 10, 10]}
        rotation={[-0.24, -0.25, 0]}
        color="#dae1df"
        intensity={1.1}
        width={9}
        height={12}
      />
      <directionalLight
        position={[-10, 17, -4]}
        color="#d8dfe3"
        intensity={2.8}
      />
      <directionalLight
        position={[4, 8, 10]}
        color="#d3ded9"
        intensity={2.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.1}
        shadow-camera-far={45}
        shadow-normalBias={0.025}
        shadow-bias={-0.0002}
      />
      <directionalLight
        position={[11, 5, -12]}
        color="#bbae95"
        intensity={0.65}
      />
      <spotLight
        position={[-4, 15, 5]}
        target-position={[3, 0, -3]}
        color="#ede3cd"
        intensity={95}
        angle={0.58}
        penumbra={0.75}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.28, 0]}
        receiveShadow
      >
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial
          color="#242b27"
          roughness={0.2}
          metalness={0.42}
        />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh
          key={i}
          position={[-15 + i * 3.5, 7, -18 - (i % 2)]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.55, 19, 1.4]} />
        </mesh>
      ))}
      <mesh position={[0, 7, -21]} material={material} receiveShadow>
        <boxGeometry args={[60, 25, 1]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={`step-${i}`}
          position={[5, -0.18 + i * 0.065, 4 - i * 0.65]}
          material={material}
          receiveShadow
        >
          <boxGeometry args={[27, 0.14, 0.65]} />
        </mesh>
      ))}
    </group>
  );
}
function RenderBudget({ onQuality }: { onQuality: (scale: number) => void }) {
  const intervals = useRef<number[]>([]);
  // Observe only already-requested frames. This hook never invalidates an idle
  // scene; native DOM labels retain their full CSS resolution at every tier.
  useFrame(({ viewport }, delta) => {
    if (delta < 0.008 || delta > 0.18) return;
    intervals.current.push(delta);
    if (intervals.current.length < 4) return;
    const ordered = intervals.current.toSorted((a, b) => a - b);
    intervals.current.length = 0;
    if (ordered[2] > 0.036 && viewport.dpr > 0.5)
      onQuality(Math.max(0.5, viewport.dpr * 0.75));
  });
  return null;
}
function ChamberMesh({
  id,
  definition,
  register,
  powered = true,
  color = mint,
  physicalLight = true,
}: {
  id: string;
  definition: Chamber;
  register: (id: string, g: THREE.Group | null) => void;
  powered?: boolean;
  color?: THREE.Color;
  physicalLight?: boolean;
}) {
  const { width: w, height: h, depth } = definition;
  const geometry = useMemo(() => frameGeometry(w, h, depth), [w, h, depth]);
  const material = useMemo(() => metalMaterial(), []);
  const rim = useMemo(() => new THREE.EdgesGeometry(geometry, 45), [geometry]);
  const inner = useMemo(
    () =>
      rail([
        [-w / 2 + 0.28, -h / 2 + 0.28, depth + 0.05],
        [-w / 2 + 0.28, h / 2 - 0.28, depth + 0.05],
        [w / 2 - 0.28, h / 2 - 0.28, depth + 0.05],
        [w / 2 - 0.28, -h / 2 + 0.28, depth + 0.05],
      ]),
    [w, h, depth],
  );
  const light = useMemo(() => {
    const material = railMaterial(color);
    material.uniforms.uLit.value = powered ? 1 : 0;
    return material;
  }, [color, powered]);
  useEffect(
    () => () => {
      geometry.dispose();
      rim.dispose();
      material.dispose();
    },
    [geometry, rim, material],
  );
  useEffect(() => () => light.dispose(), [light]);
  return (
    <group
      ref={(g) => register(id, g)}
      position={definition.position}
      rotation={[
        0,
        id === "treasury" ? 0.04 : 0,
        id === "treasury" ? 0.16 : 0.035,
      ]}
    >
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <lineSegments geometry={rim}>
        <lineBasicMaterial color="#838479" transparent opacity={0.13} />
      </lineSegments>
      <mesh name="chamber-light" material={light}>
        <tubeGeometry args={[inner, 40, 0.022, 5, false]} />
      </mesh>
      {physicalLight && (
        <rectAreaLight
          name="authority-light"
          position={[0, h / 2 - 0.24, depth * 0.62]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={color}
          intensity={powered ? 4 : 0}
          width={w - 0.52}
          height={depth * 0.8}
        />
      )}
      {id === "treasury" &&
        [1, 2].map((i) => (
          <mesh
            key={i}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
            position={[0, 0, -i * (depth + 0.12)]}
            scale={[1 - i * 0.12, 1 - i * 0.12, 1]}
          />
        ))}
      <mesh
        position={[0, -h / 2 - 0.3, depth / 2]}
        material={material}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w + 0.4, 0.5, depth + 1.1]} />
      </mesh>
    </group>
  );
}
function Conduit({
  id,
  curve,
  litColor = mint,
  register,
}: {
  id: string;
  curve: THREE.Curve<THREE.Vector3>;
  litColor?: THREE.Color;
  register: (id: string, m: THREE.Mesh | null) => void;
}) {
  const material = useMemo(() => railMaterial(litColor), [litColor]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group>
      {!id.startsWith("impact") && (
        <mesh position={[0, -0.05, -0.055]}>
          <tubeGeometry args={[curve, 70, 0.065, 6, false]} />
          <meshStandardMaterial
            color="#171d1c"
            metalness={0.55}
            roughness={0.5}
          />
        </mesh>
      )}
      <mesh ref={(m) => register(id, m)} material={material}>
        <tubeGeometry
          args={[curve, 70, id.startsWith("impact") ? 0.018 : 0.045, 6, false]}
        />
      </mesh>
    </group>
  );
}
function impactCurves() {
  const [x0, x1, y0, y1, z0, z1] = [-1.15, 5.6, -0.12, 4.68, -8.4, 0.35];
  const a: V3[] = [
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
  ];
  return [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ].map(([s, e]) => rail([a[s], a[e]]));
}
function AuthorityStage(props: LoomProps) {
  const { onUnavailable } = props;
  const { camera, size, invalidate, gl, set } = useThree();
  const actors = useRef<Record<string, THREE.Group>>({}),
    paths = useRef<Record<string, THREE.Mesh>>({});
  // Keep the shader's light count constant while geometry is delegated. Adding
  // lights per child would synchronously recompile every PBR shader mid-action.
  const authorityLights = useRef<Record<string, THREE.RectAreaLight>>({});
  const flatGroup = useRef<THREE.Group>(null);
  const structure = useRef<THREE.Group>(null);
  const frames = useMemo(
    () =>
      props.model.nodes.map((n) => ({
        node: n,
        definition: chambers[n.id] ?? {
          position: [n.depth * 1.4, 2, -n.depth * 3] as V3,
          width: 3,
          height: 2,
          depth: 1,
          label: [n.depth * 1.4, 3.5, -n.depth * 3] as V3,
        },
      })),
    [props.model.nodes],
  );
  const connections = useMemo(
    () =>
      frames
        .filter((f) => !!f.node.parent)
        .map((f) => {
          const parent = frames.find(
            (p) => p.node.id === f.node.parent,
          )!.definition;
          const a: V3 =
              f.node.parent === "treasury" ? [4.2, 5.8, 2] : parent.position,
            b = f.definition.position;
          const parentWidth =
            parent.width * (f.node.parent === "treasury" ? 0.3 : 1);
          const parentHeight =
            parent.height * (f.node.parent === "treasury" ? 0.75 : 1);
          // Distinct physical ports prevent coincident parent tubes and explain siblings.
          const port =
            f.node.id === "research" || f.node.id === "data" ? -1 : 1;
          return {
            id: f.node.id,
            curve: rail([
              [
                a[0] + parentWidth * 0.35 * port,
                a[1] + parentHeight * 0.37,
                a[2] + parent.depth + 0.1,
              ],
              [
                a[0] + parentWidth * 0.35 * port,
                a[1] - parentHeight * 0.3,
                a[2] + parent.depth + 0.1,
              ],
              [
                b[0] + f.definition.width * 0.35 * port,
                b[1] - f.definition.height * 0.3,
                b[2] + f.definition.depth + 0.1,
              ],
              [
                b[0] + f.definition.width * 0.35 * port,
                b[1] + f.definition.height * 0.37,
                b[2] + f.definition.depth + 0.1,
              ],
            ]),
          };
        }),
    [frames],
  );
  const impact = useMemo(() => impactCurves(), []);
  const pose = useRef({
    position: new THREE.Vector3(12, 4.3, 17),
    target: new THREE.Vector3(1, 3, 0),
  });
  const broken = props.model.nodes.find((n) => n.local === "revoked");
  useEffect(() => {
    const root = gl.domElement.closest<HTMLElement>(".spatial-loom");
    if (!root) return;
    let request: number, start: number | undefined;
    const initial = pose.current.position.clone(),
      initialTarget = pose.current.target.clone();
    const initialFov =
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 38;
    const expanded = props.model.nodes.length > 1;
    const target = props.trace
      ? new THREE.Vector3(1.5, 2.9, -1.8)
      : new THREE.Vector3(expanded ? 1.8 : 1, 3, expanded ? -1.4 : 0);
    const end = new THREE.Vector3(
      expanded ? 12.5 : 12,
      expanded ? 4.6 : 4.3,
      expanded ? 18.5 : 17,
    );
    const initialRootScale =
      actors.current[props.model.root]?.scale.clone() ??
      new THREE.Vector3(1, 1, 1);
    const initialRootPosition =
      actors.current[props.model.root]?.position.clone() ??
      new THREE.Vector3(...chambers.treasury.position);
    const initialShift = structure.current?.position.x ?? 0;
    const plane = props.flatten || props.chapter === "enter";
    const selectedPath = new Set(
      authorityPath(props.model, props.selected).map((n) => n.id),
    );
    const duration = props.flatten
      ? 1150
      : props.grant
        ? (props.grantDuration ?? 1150)
        : props.preview
          ? 950
          : props.cascade
            ? 1400
            : props.trace
              ? 800
              : 650;
    const flat = operationalPoints(props.model, innerWidth * 0.705);
    root.dataset.director = "running";
    const project = (v: V3) => {
      const p = new THREE.Vector3(...v).project(camera);
      return {
        x: ((p.x + 1) * size.width) / 2,
        y: ((1 - p.y) * size.height) / 2,
      };
    };
    const tick = (now: number) => {
      if (gl.getContext().isContextLost()) {
        root.dataset.webgl = "lost";
        root.dataset.director = "idle";
        onUnavailable?.();
        return;
      }
      start ??= now;
      const elapsed = document.hidden ? duration : now - start;
      const t =
          props.flatten && camera instanceof THREE.OrthographicCamera
            ? 1
            : Math.min(1, elapsed / duration),
        ease = t * t * (3 - 2 * t);
      const compression = plane ? ease * (props.flatten ? 1 : 0.6) : 0;
      camera.position
        .copy(initial)
        .lerp(
          props.flatten
            ? new THREE.Vector3(1.8, 3, 220)
            : plane
              ? new THREE.Vector3(5, 4.6, 21)
              : end,
          ease,
        );
      const aim = initialTarget.clone().lerp(target, ease);
      camera.lookAt(aim);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov =
          initialFov + ((props.flatten ? 4.2 : 38) - initialFov) * ease;
        camera.updateProjectionMatrix();
        if (props.flatten) {
          // The final matrix is genuinely orthographic; all DOM projection uses it too.
          const half = 8.1,
            aspect = size.width / size.height;
          const ortho = new THREE.OrthographicCamera(
            -half * aspect,
            half * aspect,
            half,
            -half,
            0.1,
            1000,
          );
          for (let i = 0; i < 16; i++)
            camera.projectionMatrix.elements[i] +=
              (ortho.projectionMatrix.elements[i] -
                camera.projectionMatrix.elements[i]) *
              ease;
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        }
      }
      camera.updateMatrixWorld();
      pose.current.position.copy(camera.position);
      pose.current.target.copy(aim);
      if (structure.current)
        structure.current.position.x =
          initialShift +
          ((plane && !props.flatten ? -5 : 0) - initialShift) * ease;
      for (const light of Object.values(authorityLights.current))
        light.intensity = 0;
      for (const f of frames) {
        const g = actors.current[f.node.id];
        if (!g) continue;
        const isGrant = props.grant === f.node.id;
        const construct = isGrant
          ? THREE.MathUtils.smoothstep(t, 0.35, 0.88)
          : 1;
        g.scale.set(1, Math.max(0.001, construct), 1);
        if (f.node.id === props.model.root)
          g.scale
            .copy(initialRootScale)
            .lerp(
              new THREE.Vector3(expanded ? 0.3 : 1, expanded ? 0.75 : 1, 1),
              ease,
            );
        if (props.flatten) {
          const op = flat.points.get(f.node.id)!;
          const world = new THREE.Vector3(
            (op.x / size.width) * 2 - 1,
            1 - ((op.y + 108) / size.height) * 2,
            new THREE.Vector3(1.8, 3, -1.4).project(camera).z,
          ).unproject(camera);
          g.position
            .copy(new THREE.Vector3(...f.definition.position))
            .lerp(world, ease);
          g.scale.multiply(
            new THREE.Vector3(
              1 - compression * 0.97,
              1 - compression * 0.997,
              1 - compression * 0.99,
            ),
          );
          g.quaternion
            .setFromEuler(
              new THREE.Euler(
                0,
                f.node.id === "treasury" ? 0.04 : 0,
                f.node.id === "treasury" ? 0.16 : 0.035,
              ),
            )
            .slerp(camera.quaternion, compression);
        } else if (f.node.id === props.model.root)
          g.position
            .copy(initialRootPosition)
            .lerp(new THREE.Vector3(4.2, expanded ? 5.8 : 3.9, 2), ease);
        else g.position.set(...f.definition.position);
        const status = statusOf(props.model, f.node.id);
        const delay = Math.max(0, f.node.depth - (broken?.depth ?? 0)) * 140;
        const light = g.getObjectByName("chamber-light") as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.ShaderMaterial
        >;
        if (light) {
          light.material.uniforms.uLit.value =
            status !== "active" && elapsed >= delay
              ? 0
              : props.trace && !selectedPath.has(f.node.id)
                ? 0.32
                : 1;
          light.material.uniforms.uGrow.value = isGrant
            ? Math.min(1, t / 0.35)
            : 1;
          const localLight = authorityLights.current[f.node.id];
          if (localLight) {
            g.updateWorldMatrix(true, false);
            localLight.position.set(
              0,
              f.definition.height / 2 - 0.24,
              f.definition.depth * 0.62,
            );
            g.localToWorld(localLight.position);
            g.getWorldQuaternion(localLight.quaternion);
            localLight.quaternion.multiply(
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(-Math.PI / 2, 0, 0),
              ),
            );
            localLight.width = (f.definition.width - 0.52) * g.scale.x;
            localLight.height = f.definition.depth * 0.8 * g.scale.z;
            localLight.intensity =
              light.material.uniforms.uLit.value *
              construct *
              (props.flatten ? 1 - ease : 1) *
              4;
          }
        }
        const label = root.querySelector<HTMLElement>(
          `[data-loom-label="${f.node.id}"]`,
        );
        if (label) {
          const p = project(f.definition.label),
            op = flat.points.get(f.node.id)!;
          const goalX = props.flatten ? op.x : op.x * 0.4 + size.width * 0.31;
          const x = plane ? p.x + (goalX - p.x) * ease : p.x;
          const y = plane ? p.y + (op.y + 108 - p.y) * ease : p.y;
          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
          label.style.visibility = isGrant && t < 0.88 ? "hidden" : "visible";
          label.dataset.resolved = isGrant && t < 0.88 ? "false" : "true";
          if (plane && f.node.parent) {
            const parentFrame = frames.find(
              (p) => p.node.id === f.node.parent,
            )!;
            const pp = project(parentFrame.definition.label),
              fp = flat.points.get(f.node.parent)!;
            const goalPX = props.flatten
              ? fp.x
              : fp.x * 0.4 + size.width * 0.31;
            const px = pp.x + (goalPX - pp.x) * ease,
              py = pp.y + (fp.y + 108 - pp.y) * ease;
            root
              .querySelector(`[data-plane-edge="${f.node.id}"]`)
              ?.setAttribute("d", `M${px} ${py + 30}V${y - 30}H${x}V${y}`);
          }
        }
        const mesh = paths.current[f.node.id] as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.ShaderMaterial
        >;
        if (mesh) {
          mesh.material.uniforms.uGrow.value = isGrant
            ? Math.min(1, t / 0.35)
            : 1;
          mesh.material.uniforms.uPulse.value =
            isGrant && t < 0.38
              ? t / 0.35
              : props.trace && selectedPath.has(f.node.id)
                ? (elapsed - f.node.depth * 140) / 360
                : -1;
          mesh.material.uniforms.uLit.value =
            status !== "active" && elapsed >= delay
              ? 0
              : props.trace && !selectedPath.has(f.node.id)
                ? 0.32
                : 1;
          mesh.visible = !props.flatten;
        }
      }
      for (let i = 0; i < 12; i++) {
        const mesh = paths.current[`impact-${i}`] as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.ShaderMaterial
        >;
        if (mesh) {
          mesh.visible = !!props.preview;
          mesh.material.uniforms.uGrow.value = Math.max(
            0,
            Math.min(1, t * 2 - i / 12),
          );
        }
      }
      root.dataset.webgl = "ready";
      root.dataset.renderFrames = String(
        Number(root.dataset.renderFrames ?? 0) + 1,
      );
      if (flatGroup.current) flatGroup.current.visible = !!props.flatten;
      invalidate();
      if (t < 1) request = requestAnimationFrame(tick);
      else {
        root.dataset.director = "idle";
        if (props.flatten && camera instanceof THREE.PerspectiveCamera) {
          const half = 8.1,
            aspect = size.width / size.height;
          const orthographic = new THREE.OrthographicCamera(
            -half * aspect,
            half * aspect,
            half,
            -half,
            0.1,
            1000,
          );
          orthographic.position.copy(camera.position);
          orthographic.quaternion.copy(camera.quaternion);
          orthographic.updateMatrixWorld();
          set({ camera: orthographic });
        }
      }
    };
    request = requestAnimationFrame(tick);
    const lost = (e: Event) => {
      e.preventDefault();
      root.dataset.webgl = "lost";
      cancelAnimationFrame(request);
      root.dataset.director = "idle";
      onUnavailable?.();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(request);
      root.dataset.director = "idle";
      gl.domElement.removeEventListener("webglcontextlost", lost);
    };
  }, [
    props.model,
    props.selected,
    props.chapter,
    props.grant,
    props.grantDuration,
    props.trace,
    props.traceEpoch,
    props.preview,
    props.cascade,
    props.flatten,
    onUnavailable,
    camera,
    size,
    invalidate,
    gl,
    set,
    frames,
    broken,
  ]);
  return (
    <>
      <Environment />
      {Object.entries(chambers).map(([id, definition]) => (
        <rectAreaLight
          key={`authority-light-${id}`}
          ref={(light) => {
            if (light) authorityLights.current[id] = light;
          }}
          color={mint}
          intensity={0}
          width={definition.width - 0.52}
          height={definition.depth * 0.8}
        />
      ))}
      <group ref={structure}>
        {frames.map((f) => (
          <ChamberMesh
            key={f.node.id}
            id={f.node.id}
            definition={f.definition}
            physicalLight={false}
            register={(id, g) => {
              if (g) actors.current[id] = g;
            }}
          />
        ))}
        {connections.map((c) => (
          <Conduit
            key={c.id}
            id={c.id}
            curve={c.curve}
            register={(id, m) => {
              if (m) paths.current[id] = m;
            }}
          />
        ))}
        <group visible={!!props.preview}>
          {impact.map((curve, i) => (
            <Conduit
              key={`impact-${i}`}
              id={`impact-${i}`}
              curve={curve}
              litColor={copper}
              register={(id, m) => {
                if (m) paths.current[id] = m;
              }}
            />
          ))}
        </group>
        {broken && (
          <mesh
            position={[0.07, 3.97, 0.48]}
            rotation={[0, 0, -0.2]}
            renderOrder={10}
          >
            <boxGeometry args={[0.16, 0.64, 0.18]} />
            <meshBasicMaterial color="#ff4742" toneMapped={false} />
          </mesh>
        )}
      </group>
      <group ref={flatGroup} />
    </>
  );
}
function ArenaStage(props: LoomProps) {
  const { onUnavailable } = props;
  const { camera, size, invalidate, gl } = useThree();
  const paths = useRef<Record<string, THREE.Mesh>>({});
  const gate = useRef<THREE.Group>(null);
  const arena = props.arena!;
  const funded = arena.status !== "ready",
    submitted = arena.status === "submitted" || arena.status === "settled",
    settled = arena.status === "settled";
  const anchors = useMemo<Record<string, V3>>(
    () => ({
      mission: [-0.4, 4.3, 2.8],
      capital: [-0.5, 5.7, -0.5],
      verifier: [7.4, 5.4, -1],
      outcome: [12.2, 3.9, -0.5],
    }),
    [],
  );
  const curves = useMemo(
    () => ({
      fund: rail([
        [-3, 6, 0],
        [-1, 6, 0],
        [-1, 4, 2.5],
      ]),
      ...Object.fromEntries(
        [0, 1, 2].map((i) => [
          `lane-${i}`,
          rail([
            [2.8, 3.8 - i * 0.83, 2.5],
            [5.7, 3.8 - i * 0.83, 2.5],
            [6.7, 3.25, -0.8],
            [8.2, 3.25, -0.8],
          ]),
        ]),
      ),
      settle: rail([
        [8.2, 3.25, -0.8],
        [10.5, 3.25, -0.8],
        [12.3, 3.25, 0.2],
      ]),
    }),
    [],
  );
  useEffect(() => {
    const root = gl.domElement.closest<HTMLElement>(".spatial-loom");
    if (!root) return;
    let raf: number, start: number | undefined;
    root.dataset.director = "running";
    const tick = (now: number) => {
      if (gl.getContext().isContextLost()) {
        root.dataset.webgl = "lost";
        root.dataset.director = "idle";
        onUnavailable?.();
        return;
      }
      start ??= now;
      const t = document.hidden
        ? 1
        : Math.min(1, (now - start) / (settled ? 1300 : funded ? 900 : 400));
      camera.position.set(13, 5.6, 17.5);
      camera.lookAt(3.4, 3.3, 0);
      camera.updateMatrixWorld();
      for (const [id, mesh] of Object.entries(paths.current)) {
        const mat = mesh.material as THREE.ShaderMaterial;
        const lane = id.startsWith("lane"),
          chosen =
            lane &&
            Number(id.slice(-1)) ===
              (settled ? arena.winnerIndex : arena.candidate);
        mesh.visible =
          id === "fund" ? funded : id === "settle" ? settled : submitted;
        mat.uniforms.uLit.value = lane
          ? settled && chosen
            ? 1
            : arena.preview && chosen
              ? 0.85
              : 0.08
          : 1;
        mat.uniforms.uColor.value =
          settled && (chosen || id === "settle")
            ? brass
            : arena.preview && chosen
              ? copper
              : mint;
        mat.uniforms.uGrow.value =
          id === "settle"
            ? Math.min(1, Math.max(0, (t - 0.3) / 0.7))
            : Math.min(1, t / 0.55);
        mat.uniforms.uPulse.value = t < 1 ? t : -1;
      }
      if (gate.current)
        gate.current.scale.x = arena.preview || settled ? 0.72 : 1;
      const field = root.parentElement!;
      for (const [id, v] of Object.entries(anchors)) {
        const p = new THREE.Vector3(...v).project(camera);
        const el = field.querySelector<HTMLElement>(
          `[data-arena-label="${id}"]`,
        );
        if (el) {
          el.style.left = `${((p.x + 1) * size.width) / 2}px`;
          el.style.top = `${((1 - p.y) * size.height) / 2}px`;
        }
      }
      for (let i = 0; i < arena.names.length; i++) {
        const p = new THREE.Vector3(4.3, 4.24 - i * 0.83, 2.9).project(camera);
        const el = field.querySelector<HTMLElement>(
          `[data-arena-label="lane-${i}"]`,
        );
        if (el) {
          el.style.left = `${((p.x + 1) * size.width) / 2}px`;
          el.style.top = `${((1 - p.y) * size.height) / 2}px`;
        }
      }
      root.dataset.webgl = "ready";
      root.dataset.renderFrames = String(
        Number(root.dataset.renderFrames ?? 0) + 1,
      );
      invalidate();
      if (t < 1) raf = requestAnimationFrame(tick);
      else root.dataset.director = "idle";
    };
    raf = requestAnimationFrame(tick);
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
      root.dataset.webgl = "lost";
      root.dataset.director = "idle";
      onUnavailable?.();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(raf);
      root.dataset.director = "idle";
      gl.domElement.removeEventListener("webglcontextlost", lost);
    };
  }, [
    arena,
    camera,
    size,
    invalidate,
    gl,
    funded,
    submitted,
    settled,
    anchors,
    onUnavailable,
  ]);
  const material = useMemo(() => metalMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <>
      <Environment />
      <group position={[1.3, 2.7, 2.4]} rotation={[0, 0, -0.07]}>
        <mesh material={material} castShadow receiveShadow>
          <boxGeometry args={[4.4, 4.6, 0.6]} />
        </mesh>
        <mesh
          position={[0, -2.4, 0.4]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[5.1, 0.4, 1.8]} />
        </mesh>
      </group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[5.2, 3.8 - i * 0.83, 0.5]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[6, 0.29, 1]} />
        </mesh>
      ))}
      <group ref={gate}>
        <ChamberMesh
          id="verifier"
          definition={{
            position: [8.0, 2.8, -0.8],
            width: 1.5,
            height: 5.6,
            depth: 0.8,
            label: [0, 0, 0],
          }}
          register={() => {}}
          powered={arena.preview || settled}
          color={settled ? brass : copper}
        />
      </group>
      <ChamberMesh
        id="winner"
        definition={{
          position: [12.4, 2.25, 0.2],
          width: 1.7,
          height: 4.4,
          depth: 0.6,
          label: [0, 0, 0],
        }}
        register={() => {}}
        powered={settled}
        color={brass}
      />
      {Object.entries(curves).map(([id, curve]) => (
        <Conduit
          key={id}
          id={id}
          curve={curve}
          register={(id, m) => {
            if (m) paths.current[id] = m;
          }}
        />
      ))}
    </>
  );
}
export default function LoomScene(props: LoomProps) {
  const [renderScale, setRenderScale] = useState(1);
  return (
    <Canvas
      className="loom-canvas"
      frameloop="demand"
      dpr={renderScale}
      shadows="soft"
      camera={{ fov: 38, near: 0.1, far: 1000, position: [12, 6.3, 17] }}
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.9;
      }}
    >
      <RenderBudget onQuality={setRenderScale} />
      {props.arena ? <ArenaStage {...props} /> : <AuthorityStage {...props} />}
    </Canvas>
  );
}
