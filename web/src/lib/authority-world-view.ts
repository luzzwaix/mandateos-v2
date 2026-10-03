import {
  authorityPath,
  descendantsOf,
  statusOf,
  type AuthorityModel,
} from "./authority";
import {
  authorityLayout,
  PLATE_HEIGHT,
  PLATE_WIDTH,
  ROOT_HEIGHT,
  ROOT_WIDTH,
} from "./authority-layout";

/** Read-only orthographic projection. Depth encodes delegation, never money.
 * Faces and native labels share anchors; completion never changes model state.
 */
export function authorityWorldView(
  model: AuthorityModel,
  selected: string,
  width: number,
  depth = 1,
) {
  const flat = authorityLayout(model, width);
  const nodes = model.nodes.flatMap((node) => {
    const point = flat.points.get(node.id);
    if (!point) return [];
    const z = -0.55 * node.depth * depth || 0;
    return [
      {
        node,
        status: statusOf(model, node.id),
        z,
        x: point.x + z * 16,
        y: point.y - z * 10,
        width: node.parent ? PLATE_WIDTH : ROOT_WIDTH,
        height: node.parent ? PLATE_HEIGHT : ROOT_HEIGHT,
      },
    ];
  });
  return {
    model,
    canonical: flat.canonical,
    nodes,
    ancestry: authorityPath(model, selected).map((node) => node.id),
    height: Math.max(flat.height, ...nodes.map((p) => p.y + p.height + 20)),
  };
}

/** Twelve wire segments from the actual subtree's label and depth extents. */
export function authorityVolume(
  view: ReturnType<typeof authorityWorldView>,
  id: string,
) {
  const ids = new Set([
    id,
    ...descendantsOf(view.model, id).map((node) => node.id),
  ]);
  const nodes = view.nodes.filter((item) => ids.has(item.node.id));
  if (!nodes.length) return [];
  const left = Math.min(...nodes.map((p) => p.x - p.width / 2)) - 22;
  const right = Math.max(...nodes.map((p) => p.x + p.width / 2)) + 22;
  const top = Math.min(...nodes.map((p) => p.y)) - 20;
  const bottom = Math.max(...nodes.map((p) => p.y + p.height)) + 20;
  const extent =
    Math.max(...nodes.map((p) => p.z)) - Math.min(...nodes.map((p) => p.z));
  const shift = Math.min(28, Math.abs(extent) * 20);
  const corners = [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ];
  const back = corners.map(([x, y]) => [x + shift, y - shift * 0.6]);
  const segment = (a: number[], b: number[]) =>
    `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  return [
    ...corners.map((p, i) => segment(p, corners[(i + 1) % 4])),
    ...back.map((p, i) => segment(p, back[(i + 1) % 4])),
    ...corners.map((p, i) => segment(p, back[i])),
  ];
}

export function plaqueRim(
  p: { x: number; y: number; width: number; height: number },
  depth = 1,
) {
  const l = p.x - p.width / 2,
    r = p.x + p.width / 2,
    t = p.y,
    b = p.y + p.height;
  const x = 4 * depth,
    y = -3 * depth;
  return `M${l} ${t}l${x} ${y}H${r + x}V${b + y}L${r} ${b}M${r} ${t}l${x} ${y}`;
}
