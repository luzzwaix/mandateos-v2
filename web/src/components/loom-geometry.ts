import * as THREE from "three";

import {
  instruments,
  colors,
  parentIndexes,
  missionSweep,
  missionFunding,
  submissionSweeps,
  verifierSweeps,
  settlementSweep,
  type V,
} from "./loom-topology";
export {
  instruments,
  colors,
  parentIndexes,
  blockLevels,
} from "./loom-topology";
export type Rail = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
export type CastJoint = THREE.Mesh<
  THREE.BufferGeometry,
  THREE.MeshStandardMaterial[]
> & { growth: { value: number }; cut: { value: number } };
function curve(points: V[]) {
  return new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal",
    0.2,
  );
}

// A broad folded strip, with a rounded shoulder and a dark, deep underside.
// Unlike an extruded plaque its face follows the authority's continuous path.
function fold(points: V[], width: number, depth: number, taper = 0.7) {
  const path = curve(points),
    positions: number[] = [],
    indices: number[] = [],
    uv: number[] = [];
  const sections = 64;
  const profile = [
    [-0.5, 0],
    [-0.43, 0.09],
    [-0.25, 0.16],
    [0, 0.19],
    [0.25, 0.16],
    [0.43, 0.09],
    [0.5, 0],
    [0.5, -depth],
    [-0.5, -depth],
  ];
  const sides = profile.length;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections,
      p = path.getPoint(t),
      tangent = path.getTangent(t);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const turn = Math.sin(t * Math.PI * 1.35 - 0.35) * 0.32;
    const w = width * (1 - (1 - taper) * t) * (1 + 0.2 * Math.sin(t * Math.PI));
    for (const [u, z] of profile) {
      const across = u * w * Math.cos(turn) - z * Math.sin(turn);
      const rise = u * w * Math.sin(turn) + z * Math.cos(turn);
      positions.push(
        p.x + normal.x * across,
        p.y + normal.y * across,
        p.z + rise,
      );
      uv.push(t, u + 0.5);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  for (let face = 0; face < sides; face++) {
    const start = indices.length;
    for (let i = 0; i < sections; i++) {
      const a = i * sides + face,
        b = i * sides + ((face + 1) % sides),
        c = b + sides,
        d = a + sides;
      indices.push(a, b, d, b, c, d);
    }
    geometry.addGroup(start, indices.length - start, face < 6 ? 0 : 1);
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function studio() {
  const faces = Array.from({ length: 6 }, (_, i) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const light = ctx.createLinearGradient(0, 0, 64, 64);
    light.addColorStop(0, i === 2 ? "#ffffff" : "#b5c5bd");
    light.addColorStop(0.2, "#e9e9de");
    light.addColorStop(0.38, "#8a9992");
    light.addColorStop(0.42, "#1a2622");
    light.addColorStop(0.8, "#07110e");
    light.addColorStop(1, "#9c9f91");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 64, 64);
    return canvas;
  });
  const environment = new THREE.CubeTexture(faces);
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.needsUpdate = true;
  const face = new THREE.MeshStandardMaterial({
    color: "#69786e",
    roughness: 0.2,
    metalness: 0.88,
    envMap: environment,
    envMapIntensity: 2,
    side: THREE.DoubleSide,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: "#202c26",
    roughness: 0.36,
    metalness: 0.65,
    envMap: environment,
    envMapIntensity: 0.8,
    side: THREE.DoubleSide,
  });
  const recess = new THREE.MeshStandardMaterial({
    color: "#101a16",
    roughness: 0.52,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  return { face, edge, recess, environment };
}
function lightRig(group: THREE.Group) {
  group.add(new THREE.HemisphereLight("#e5eee7", "#0b1410", 1.8));
  const key = new THREE.DirectionalLight("#fff1dc", 2);
  key.position.set(-6, 7, 12);
  group.add(key);
  const edge = new THREE.DirectionalLight("#b9d9cd", 2);
  edge.position.set(8, -4, 8);
  group.add(edge);
}
function conductor(points: V[], color = colors.mint, radius = 0.028): Rail {
  const material = new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uGrow: { value: 1 },
      uLit: { value: 1 },
      uPulse: { value: -1 },
      uCut: { value: 0 },
    },
    vertexShader:
      "varying float along;void main(){along=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying float along;uniform vec3 uColor;uniform float uGrow,uLit,uPulse,uCut;
      void main(){if(along>uGrow || (uCut>.0 && abs(along-.48)<.065*uCut))discard;
      float pulse=(1.-smoothstep(.0,.08,abs(along-uPulse)))*step(0.,uPulse);
      gl_FragColor=vec4(mix(vec3(.045,.07,.058),uColor,uLit)+pulse*.3,1.);
      #include <colorspace_fragment>}`,
  });
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve(points), 64, radius, 8, false),
    material,
  );
}
function offset(points: V[], z: number): V[] {
  return points.map(([x, y, d]) => [x, y, d + z]);
}
function boundary(points: V[], radius: number): Rail {
  const rail = conductor(points, colors.copper, radius);
  const outline = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 1; i < points.length; i++)
    outline.add(
      new THREE.LineCurve3(
        new THREE.Vector3(...points[i - 1]),
        new THREE.Vector3(...points[i]),
      ),
    );
  rail.geometry.dispose();
  rail.geometry = new THREE.TubeGeometry(
    outline,
    points.length * 8,
    radius,
    6,
    false,
  );
  return rail;
}
function sidePath(points: V[], width: number, z: number): V[] {
  return points.map((p, i) => {
    const before = points[Math.max(0, i - 1)],
      after = points[Math.min(points.length - 1, i + 1)];
    const dx = after[0] - before[0],
      dy = after[1] - before[1],
      l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * width, p[1] + (dx / l) * width, p[2] + z];
  });
}
export function authorityResources() {
  const group = new THREE.Group(),
    m = studio();
  lightRig(group);
  const materials: THREE.Material[] = [m.face, m.edge, m.recess],
    paths: Rail[] = [],
    cases: CastJoint[] = [];
  const actors = instruments.map((d, i) => {
    const actor = new THREE.Group();
    actor.position.set(...d.position);
    const local = d.sweep.map(
      ([x, y, z]) =>
        [x - d.position[0], y - d.position[1], z - d.position[2]] as V,
    );
    actor.add(
      new THREE.Mesh(fold(offset(local, -0.1), d.width * 1.17, 0.34), [
        m.edge,
        m.recess,
      ]),
    );
    actor.add(
      new THREE.Mesh(fold(local, d.width, 0.16, i === 0 ? 0.85 : 0.35), [
        m.face,
        m.edge,
      ]),
    );
    const power = conductor(
      offset(local, 0.3),
      colors.mint,
      i === 0 ? 0.026 : 0.026,
    );
    const rail = conductor(
      sidePath(local, d.width * 0.15, 0.29),
      colors.bone,
      0.01,
    );
    actor.add(power, rail);
    materials.push(power.material, rail.material);
    group.add(actor);
    if (i > 0) {
      const a =
          i === 2
            ? instruments[0].sweep.at(-1)!
            : instruments[parentIndexes[i]].outlet,
        b = d.inlet;
      const parent = instruments[parentIndexes[i]];
      const past = parent.sweep.at(-2)!;
      const ahead = d.sweep[1];
      const points: V[] = [
        a,
        [a[0] + (a[0] - past[0]) * 0.18, a[1] + (a[1] - past[1]) * 0.18, a[2]],
        [
          b[0] - (ahead[0] - b[0]) * 0.22,
          b[1] - (ahead[1] - b[1]) * 0.22,
          b[2],
        ],
        b,
      ];
      const growth = { value: 1 },
        cut = { value: 0 };
      const jointMaterials = [m.face.clone(), m.edge.clone()];
      for (const material of jointMaterials) {
        material.onBeforeCompile = (shader) => {
          shader.uniforms.castGrow = growth;
          shader.uniforms.castCut = cut;
          shader.vertexShader =
            "varying float castAlong;\n" +
            shader.vertexShader.replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\ncastAlong = uv.x;",
            );
          shader.fragmentShader =
            "varying float castAlong; uniform float castGrow; uniform float castCut;\n" +
            shader.fragmentShader.replace(
              "#include <clipping_planes_fragment>",
              "#include <clipping_planes_fragment>\nif(castAlong > castGrow || (castCut > 0. && abs(castAlong - .48) < .065 * castCut)) discard;",
            );
        };
        material.customProgramCacheKey = () => "authority-cast-joint";
      }
      const casing = new THREE.Mesh(
        fold(offset(points, -0.025), d.width * 0.85, 0.23, 0.94),
        jointMaterials,
      ) as CastJoint;
      casing.growth = growth;
      casing.cut = cut;
      const path = conductor(offset(points, 0.12), colors.mint, 0.04);
      group.add(casing, path);
      cases[i] = casing;
      paths[i] = path;
      materials.push(...jointMaterials, path.material);
    }
    return {
      group: actor,
      power,
      rail,
      anchor: new THREE.Vector3(...d.anchor),
      definition: d,
    };
  });
  const cut = new THREE.Group();
  const cutPath = (paths[1].geometry as THREE.TubeGeometry).parameters.path;
  cut.position.copy(cutPath.getPoint(0.48));
  const tangent = cutPath.getTangent(0.48);
  cut.rotation.z = Math.atan2(tangent.y, tangent.x);
  const red = new THREE.MeshBasicMaterial({
    color: colors.red,
    toneMapped: false,
  });
  materials.push(red);
  for (let side = 0; side < 2; side++) {
    const jaw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.16, 0.12, 24),
      red,
    );
    jaw.rotation.z = Math.PI / 2;
    jaw.position.x = side ? 0.08 : -0.08;
    cut.add(jaw);
  }
  group.add(cut);
  const hull: V[] = [
    [2.4, 1.55, 1.8],
    [4.3, 0.5, 1.5],
    [5.94, -1.08, 0.9],
    [5.94, -3.07, 0.4],
    [2.65, -3.57, 0.15],
    [2.3, -4.95, -0.3],
    [0.95, -4.95, -0.3],
    [0.95, -2.95, 0.4],
    [1.4, -1.2, 1.1],
    [2.4, 1.55, 1.8],
  ];
  const impact = [boundary(hull, 0.018), boundary(offset(hull, -0.95), 0.009)];
  for (const p of hull.slice(0, -1))
    impact.push(
      conductor([p, [p[0], p[1], p[2] - 0.95]], colors.copper, 0.009),
    );
  impact.forEach((p) => {
    group.add(p);
    materials.push(p.material);
  });
  return {
    group,
    actors,
    paths,
    cases,
    cut,
    impact,
    materials,
    environment: m.environment,
  };
}

export function arenaResources() {
  const group = new THREE.Group(),
    m = studio();
  lightRig(group);
  const materials: THREE.Material[] = [m.face, m.edge, m.recess],
    routes: Rail[] = [];
  const mission = new THREE.Group();
  const basin = missionSweep;
  mission.add(new THREE.Mesh(fold(basin, 1.16, 0.4, 0.8), [m.face, m.edge]));
  mission.add(
    new THREE.Mesh(fold(offset(basin, -0.17), 1.42, 0.3, 0.8), [
      m.edge,
      m.recess,
    ]),
  );
  group.add(mission);
  const funding = missionFunding;
  const fund = conductor(funding, colors.mint, 0.035);
  group.add(fund);
  routes.push(fund);
  materials.push(fund.material);
  for (let i = 0; i < 3; i++) {
    const approach = submissionSweeps[i];
    group.add(
      new THREE.Mesh(fold(approach, 0.37 - i * 0.055, 0.25, 1), [
        m.face,
        m.edge,
      ]),
    );
    const route = conductor(offset(approach, 0.34), "#89978c", 0.028);
    group.add(route);
    routes.push(route);
    materials.push(route.material);
  }
  // An asymmetric transverse clamp, opening across the three approach lanes.
  // It is an execution mechanism, not a portal or a separate labeled card.
  const gate = new THREE.Group();
  gate.position.set(7.65, 0.3, 0.48);
  for (let i = 0; i < 2; i++) {
    const jaw = verifierSweeps[i];
    gate.add(new THREE.Mesh(fold(jaw, 0.4, 0.5, 0.8), [m.face, m.edge]));
  }
  group.add(gate);
  const settlement = settlementSweep;
  group.add(
    new THREE.Mesh(fold(offset(settlement, -0.15), 0.5, 0.22, 0.65), [
      m.edge,
      m.recess,
    ]),
  );
  const settle = conductor(offset(settlement, 0.3), colors.brass, 0.035);
  group.add(settle);
  routes.push(settle);
  materials.push(settle.material);
  const anchors: V[] = [
    [-1.7, 3.9, 1.5],
    [1.35, 0.55, 1.7],
    [7.6, 3.35, 1.4],
    [8.25, -3.0, 1.1],
    ...[0, 1, 2].map((i) => [i === 2 ? 4.2 : 3.65, 3.05 - i * 1.5, 1.5] as V),
  ];
  return {
    group,
    gate,
    mission,
    routes,
    materials,
    environment: m.environment,
    anchors: anchors.map((p) => new THREE.Vector3(...p)),
  };
}
