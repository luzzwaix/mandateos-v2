"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { authorityPath, statusOf } from "@/lib/authority";
import { clamp, loomMotion, resolveEase } from "@/lib/loom-motion";
import {
  arenaResources,
  authorityResources,
  colors,
  instruments,
  parentIndexes,
  blockLevels,
} from "./loom-geometry";
import { operationalPoints } from "./flat-authority-tree";
import type { LoomProps } from "./spatial-loom";
/* eslint-disable react-hooks/immutability -- The director mutates R3F-owned GPU resources/camera, never React or application state. */
type Profile = {
  cpu: number[];
  gpu: number[];
  frames: number[];
  startupMs: number;
  programs: number;
  calls: number;
  triangles: number;
  gpuAvailable: boolean;
};
declare global {
  interface Window {
    __loomProfile?: Profile;
  }
}
function Stage(props: LoomProps) {
  const { onUnavailable } = props;
  const { gl, camera, size, invalidate, setDpr, scene } = useThree();
  const isArena = !!props.arena;
  const resource = useMemo(
    () => (isArena ? arenaResources() : authorityResources()),
    [isArena],
  );
  const state = useRef<{
    start: number;
    duration: number;
    root: HTMLElement | null;
    labels: (HTMLElement | null)[];
    exists: boolean[];
    lit: number[];
    ratio: number[];
    flat: { x: number; y: number }[];
    active: boolean;
    frame: number;
    last: number;
    slow: number;
    scale: number;
    profile: Profile | null;
    planes: (SVGPathElement | null)[];
    guides: (SVGPathElement | null)[];
    cameraStart: number;
    cameraEnd: number;
    freshCascade: boolean;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    key: string;
    statuses: string[];
  }>({
    start: 0,
    duration: 0,
    root: null,
    labels: [],
    exists: [],
    lit: [],
    ratio: [],
    flat: [],
    active: true,
    frame: 0,
    last: 0,
    slow: 0,
    scale: 0.85,
    profile: null,
    planes: [],
    guides: [],
    cameraStart: 1,
    cameraEnd: 1,
    freshCascade: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    key: "",
    statuses: [],
  });
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const previous = useRef({ cascade: false });
  const zoom = useRef(1);
  useEffect(() => {
    const begun = performance.now();
    // Compile the fixed inventory before any action; delegation only changes
    // transforms/uniforms of these same objects and never mounts a material.
    gl.compile(scene, camera);
    if (new URLSearchParams(location.search).has("profile")) {
      const profile: Profile = {
        cpu: [],
        gpu: [],
        frames: [],
        startupMs: performance.now() - begun,
        programs: gl.info.programs?.length ?? 0,
        calls: 0,
        triangles: 0,
        gpuAvailable: !!gl
          .getContext()
          .getExtension("EXT_disjoint_timer_query_webgl2"),
      };
      window.__loomProfile = profile;
      state.current.profile = profile;
      const context = gl.getContext() as WebGL2RenderingContext;
      const timer = context.getExtension("EXT_disjoint_timer_query_webgl2");
      // A bounded query pool is created before interaction, not per frame.
      const queries = timer
        ? Array.from({ length: 8 }, () => ({
            query: context.createQuery()!,
            pending: false,
          }))
        : [];
      let queryIndex = 0;
      const original = gl.render.bind(gl);
      gl.render = (s, c) => {
        const slot = queries[queryIndex];
        if (
          slot?.pending &&
          context.getQueryParameter(slot.query, context.QUERY_RESULT_AVAILABLE)
        ) {
          if (!context.getParameter(timer.GPU_DISJOINT_EXT))
            profile.gpu.push(
              context.getQueryParameter(slot.query, context.QUERY_RESULT) /
                1_000_000,
            );
          slot.pending = false;
        }
        if (slot && !slot.pending)
          context.beginQuery(timer.TIME_ELAPSED_EXT, slot.query);
        const before = performance.now();
        original(s, c);
        profile.cpu.push(performance.now() - before);
        if (slot && !slot.pending) {
          context.endQuery(timer.TIME_ELAPSED_EXT);
          slot.pending = true;
        }
        if (queries.length) queryIndex = (queryIndex + 1) % queries.length;
        profile.calls = gl.info.render.calls;
        profile.triangles = gl.info.render.triangles;
        profile.programs = gl.info.programs?.length ?? 0;
      };
      return () => {
        gl.render = original;
        queries.forEach((slot) => context.deleteQuery(slot.query));
      };
    }
  }, [gl, scene, camera]);
  useEffect(() => {
    const s = state.current;
    // React may rerender after the navigation's scroll event. That does not
    // constitute a new product event and must not truncate a depth cascade.
    const key = [
      size.width,
      size.height,
      props.chapter,
      props.selected,
      props.grant,
      props.grantDuration,
      props.trace,
      props.traceEpoch,
      props.preview,
      props.cascade,
      props.flatten,
      props.arena?.status,
      props.arena?.candidate,
      props.arena?.preview,
      props.arena?.winnerIndex,
      ...props.model.nodes.map((n) => `${n.id}:${n.available}:${n.local}`),
    ].join("|");
    if (s.key === key) return;
    s.key = key;
    s.start = performance.now();
    s.active = true;
    s.last = 0;
    s.slow = 0;
    s.cameraStart = zoom.current;
    const plane = props.flatten || props.chapter === "enter";
    const source =
      !isArena && props.chapter === "genesis" && props.model.nodes.length === 1;
    s.cameraEnd = plane ? 1 : source ? 1.92 : props.trace ? 1.09 : 1.06;
    s.fromX = resource.group.position.x;
    s.fromY = resource.group.position.y;
    s.toX = source ? -2.65 : -1.1;
    s.toY = source ? -2.3 : 0;
    s.freshCascade = !!props.cascade && !previous.current.cascade;
    s.duration = props.arena
      ? loomMotion.settlement
      : props.grant
        ? (props.grantDuration ?? loomMotion.recursion)
        : plane
          ? loomMotion.plane
          : s.freshCascade
            ? loomMotion.cascade
            : props.preview
              ? loomMotion.impact
              : props.trace
                ? loomMotion.trace
                : 150;
    const ancestry = new Set(
      authorityPath(props.model, props.selected).map((n) => n.id),
    );
    s.exists = instruments.map((d) =>
      props.model.nodes.some((n) => n.id === d.id),
    );
    s.lit = instruments.map((d) =>
      statusOf(props.model, d.id) === "active"
        ? props.trace && !ancestry.has(d.id)
          ? 0.25
          : 1
        : 0,
    );
    s.statuses = instruments.map((d) => statusOf(props.model, d.id));
    s.ratio = instruments.map((d) => {
      const n = props.model.nodes.find((n) => n.id === d.id);
      return n && n.budget > 0n
        ? Number((n.available * 10000n) / n.budget) / 10000
        : 0;
    });
    const flat = operationalPoints(props.model, size.width * 0.695);
    s.flat = instruments.map((d) => flat.points.get(d.id) ?? { x: 0, y: 0 });
    previous.current = { cascade: !!props.cascade };
    s.root = null;
    invalidate();
  }, [props, size.width, size.height, invalidate, resource, isArena]);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      state.current.active = false;
      if (state.current.root) {
        state.current.root.dataset.webgl = "lost";
        state.current.root.dataset.director = "idle";
      }
      onUnavailable?.();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onUnavailable]);
  useEffect(
    () => () => {
      resource.group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      resource.materials.forEach((m) => m.dispose());
      resource.environment.dispose();
    },
    [resource],
  );
  useFrame(() => {
    const s = state.current;
    if (!s.active) return;
    if (!s.root) {
      // Canvas can still be detached during its React commit. Retry on demand
      // instead of returning permanently from the initial effect.
      s.root = gl.domElement.closest<HTMLElement>(".spatial-loom");
      if (!s.root) {
        invalidate();
        return;
      }
      const arenaIds = [
        "capital",
        "mission",
        "verifier",
        "outcome",
        "lane-0",
        "lane-1",
        "lane-2",
      ];
      const host = props.arena ? s.root.parentElement! : s.root;
      s.labels = (props.arena ? arenaIds : instruments.map((d) => d.id)).map(
        (id) =>
          host.querySelector<HTMLElement>(
            `[data-${props.arena ? "arena" : "loom"}-label="${id}"]`,
          ),
      );
      s.planes = instruments.map((d) =>
        s.root!.querySelector<SVGPathElement>(`[data-plane-edge="${d.id}"]`),
      );
      s.guides = instruments.map((d) =>
        s.root!.querySelector<SVGPathElement>(`[data-loom-guide="${d.id}"]`),
      );
      s.root.dataset.director = "running";
    }
    const now = performance.now(),
      elapsed = now - s.start,
      t = document.hidden ? 1 : clamp(elapsed / s.duration),
      ease = resolveEase(t);
    if (s.last) {
      const dt = now - s.last;
      s.profile?.frames.push(dt);
      if (dt > 23) s.slow++;
    }
    s.last = now;
    if (s.slow >= 4 && s.scale > 0.55) {
      s.scale = Math.max(0.55, s.scale - 0.15);
      setDpr(s.scale);
      s.slow = 0;
    }
    camera.position.set(3, 5, 26);
    camera.lookAt(0, 0, 0);
    if (camera instanceof THREE.OrthographicCamera) {
      camera.zoom =
        (size.height / 14.6) *
        (s.cameraStart + (s.cameraEnd - s.cameraStart) * ease);
      zoom.current = s.cameraStart + (s.cameraEnd - s.cameraStart) * ease;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    if ("actors" in resource) {
      const r = resource,
        plane = !!props.flatten || props.chapter === "enter";
      r.group.position.set(
        s.fromX + (s.toX - s.fromX) * ease,
        s.fromY + (s.toY - s.fromY) * ease,
        0,
      );
      r.group.scale.z = plane ? 1 - ease : 1;
      r.group.visible = !plane || t < 1;
      for (let i = 0; i < r.actors.length; i++) {
        const a = r.actors[i],
          d = a.definition,
          isGrant = d.id === props.grant;
        const grown = isGrant ? clamp(t / 0.48) : 1,
          resolved = isGrant ? resolveEase((t - 0.5) / 0.5) : 1;
        a.group.visible = s.exists[i];
        a.group.scale.setScalar(Math.max(0.0001, resolved));
        a.group.position.set(...d.position);
        const delay = s.freshCascade
          ? blockLevels[i] * loomMotion.depthInterval
          : 0;
        const block = s.freshCascade ? clamp((elapsed - delay) / 350) : 1;
        const lit = s.lit[i] === 0 ? 1 - block : s.lit[i];
        a.power.material.uniforms.uLit.value = lit;
        a.rail.material.uniforms.uLit.value = lit;
        a.rail.material.uniforms.uGrow.value = s.ratio[i];
        if (r.paths[i]) {
          const p = r.paths[i];
          p.visible = s.exists[i];
          p.material.uniforms.uGrow.value = grown;
          p.material.uniforms.uLit.value = lit;
          p.material.uniforms.uCut.value =
            i === 1 && props.cascade ? resolveEase(t / 0.25) * 2.5 : 0;
          const casing = r.cases[i];
          casing.visible = p.visible;
          casing.growth.value = grown;
          casing.cut.value = p.material.uniforms.uCut.value;
          const traceProgress = (elapsed - blockLevels[i] * 180) / 220;
          p.material.uniforms.uPulse.value =
            isGrant && t < 0.5
              ? t / 0.48
              : props.trace && s.lit[i] === 1 && t < 1
                ? traceProgress >= 0 && traceProgress <= 1
                  ? traceProgress
                  : -1
                : -1;
        }
        const label = s.labels[i];
        if (label) {
          scratch.copy(a.anchor);
          r.group.localToWorld(scratch);
          scratch.project(camera);
          let x = (scratch.x + 1) * size.width * 0.5,
            y = (1 - scratch.y) * size.height * 0.5;
          if (plane) {
            x += (s.flat[i].x - x) * ease;
            y += (s.flat[i].y + 130 - y) * ease;
          }
          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
          label.style.visibility =
            !s.exists[i] || (isGrant && t < 0.85) ? "hidden" : "visible";
          label.dataset.resolved = isGrant && t < 0.85 ? "false" : "true";
          label.dataset.effective = lit > 0.5 ? "active" : s.statuses[i];
          const guide = s.guides[i];
          if (guide) {
            scratch.set(...d.sweep[1]);
            scratch.z += 0.3;
            r.group.localToWorld(scratch);
            scratch.project(camera);
            const targetX = (scratch.x + 1) * size.width * 0.5,
              targetY = (1 - scratch.y) * size.height * 0.5;
            const onLeft = i === 1 || i === 3;
            const startX = x + (onLeft ? 145 : -12),
              startY = y - 12;
            guide.setAttribute(
              "d",
              `M${startX} ${startY}H${onLeft ? targetX - 20 : targetX + 20}L${targetX} ${targetY}`,
            );
            guide.style.visibility =
              plane || !s.exists[i] || (isGrant && t < 0.85)
                ? "hidden"
                : "visible";
          }
        }
      }
      r.cut.visible = !!props.cascade;
      r.cut.children[0].position.x = -0.08 - 0.32 * resolveEase(t / 0.3);
      r.cut.children[1].position.x = 0.08 + 0.32 * resolveEase(t / 0.3);
      for (let i = 0; i < r.impact.length; i++) {
        const p = r.impact[i];
        p.visible = !!props.preview;
        p.material.uniforms.uGrow.value = clamp(t * 1.4 - i * 0.07);
      }
      if (plane) {
        for (let i = 1; i < instruments.length; i++) {
          const parent = parentIndexes[i],
            label = s.labels[i],
            pl = s.labels[parent];
          if (label && pl)
            s.planes[i]?.setAttribute(
              "d",
              `M${pl.style.left.replace("px", "")} ${Number(pl.style.top.replace("px", "")) + 28}V${Number(label.style.top.replace("px", "")) - 28}H${label.style.left.replace("px", "")}V${label.style.top.replace("px", "")}`,
            );
        }
      }
    } else {
      const r = resource,
        a = props.arena!,
        funded = a.status !== "ready",
        submitted = a.status === "submitted" || a.status === "settled",
        settled = a.status === "settled";
      for (let i = 0; i < r.routes.length; i++) {
        const p = r.routes[i],
          lane = i > 0 && i < 4,
          chosen = i - 1 === (settled ? a.winnerIndex : a.candidate);
        p.visible = i === 0 ? funded : i === 4 ? settled : submitted;
        p.material.uniforms.uGrow.value =
          i === 4 ? clamp((t - 0.3) / 0.7) : clamp(t / 0.55);
        p.material.uniforms.uLit.value = lane
          ? chosen && (a.preview || settled)
            ? 1
            : 0.2
          : 1;
        p.material.uniforms.uColor.value.set(
          settled && (chosen || i === 4)
            ? colors.brass
            : a.preview && chosen
              ? colors.copper
              : i === 0
                ? colors.mint
                : "#adb7ac",
        );
        p.material.uniforms.uPulse.value = t < 1 ? t : -1;
      }
      r.gate.children[0].position.x =
        -0.28 - (a.preview || settled ? 0.22 * ease : 0);
      r.gate.children[1].position.x =
        0.28 + (a.preview || settled ? 0.22 * ease : 0);
      for (let i = 0; i < r.anchors.length; i++) {
        const label = s.labels[i];
        if (!label) continue;
        scratch.copy(r.anchors[i]).project(camera);
        label.style.left = `${(scratch.x + 1) * size.width * 0.5}px`;
        label.style.top = `${(1 - scratch.y) * size.height * 0.5}px`;
      }
    }
    s.root.dataset.webgl = "ready";
    s.root.dataset.renderFrames = String(++s.frame);
    s.root.dataset.programs = String(gl.info.programs?.length ?? 0);
    s.root.dataset.renderScale = String(s.scale);
    if (t < 1) invalidate();
    else {
      s.active = false;
      s.root.dataset.director = "idle";
    }
  });
  return <primitive object={resource.group} dispose={null} />;
}
export default function LoomScene(props: LoomProps) {
  return (
    <Canvas
      className="loom-canvas"
      frameloop="demand"
      orthographic
      dpr={0.85}
      camera={{ near: 0.1, far: 80, position: [3, 5, 26], zoom: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping;
        gl.setClearColor("#111617", 0);
      }}
    >
      <Stage {...props} />
    </Canvas>
  );
}
