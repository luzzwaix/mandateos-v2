import { expect } from "chai";
import {
  authorityLayout,
  authorityLedger,
  capitalInstrumentRoles,
} from "../web/src/lib/authority-layout";
import { FIXTURE_LABELS } from "../web/src/lib/solana/fixture-labels";
import {
  authorityWorldView,
  authorityVolume,
} from "../web/src/lib/authority-world-view";
import {
  amount,
  authorityPath,
  descendantsOf,
  genesis,
  impactFingerprint,
  revokeDemo,
  spendDemo,
  fundDemoMission,
  settleDemoMission,
  statusOf,
} from "../web/src/lib/authority";

const u = (n: number) => BigInt(n) * 1_000_000n;
const node = (m: ReturnType<typeof genesis>, id: string) =>
  m.nodes.find((n) => n.id === id)!;
describe("Authority Chamber accounting and state selectors", () => {
  it("retains actual fixture PDA identity while using the approved geometry only for matching topology", () => {
    const ids = Object.fromEntries(
      Object.entries(FIXTURE_LABELS).map(([pda, name]) => [
        name.toLowerCase(),
        pda,
      ]),
    );
    const demo = genesis();
    const model = {
      ...demo,
      root: ids.treasury,
      nodes: demo.nodes
        .filter((n) => n.id !== "analysis")
        .map((n) => ({
          ...n,
          id: ids[n.id],
          parent: n.parent ? ids[n.parent] : null,
        })),
    };
    const before = structuredClone(model);
    expect(capitalInstrumentRoles(model)?.[ids.scraper]).eq("scraper");
    expect(model).deep.eq(before);
    const malformed = {
      ...model,
      nodes: model.nodes.map((n) =>
        n.id === ids.scraper ? { ...n, parent: ids.operations } : n,
      ),
    };
    expect(capitalInstrumentRoles(malformed)).eq(undefined);
    const arbitrary = {
      ...model,
      nodes: model.nodes.map((n) =>
        n.id === ids.scraper
          ? { ...n, id: "another-account", name: "Scraper" }
          : n,
      ),
    };
    expect(capitalInstrumentRoles(arbitrary)).eq(undefined);
  });
  it("projects the original accounts and keeps sibling geometry across construction and revoke", () => {
    const m = genesis(),
      before = authorityWorldView(m, "scraper", 864);
    expect(before.model).eq(m);
    before.nodes.forEach((p) => expect(p.node).eq(node(m, p.node.id)));
    for (let count = 1; count <= 6; count++) {
      const partial = authorityWorldView(genesis(count), "treasury", 864);
      partial.nodes.forEach((p) => {
        const expected = before.nodes.find(
          (item) => item.node.id === p.node.id,
        )!;
        expect([p.x, p.y, p.z]).deep.eq([expected.x, expected.y, expected.z]);
      });
    }
    const after = authorityWorldView(revokeDemo(m, "research"), "scraper", 864);
    expect(after.nodes.find((p) => p.node.id === "operations")).deep.eq(
      before.nodes.find((p) => p.node.id === "operations"),
    );
    expect(after.ancestry).deep.eq(["treasury", "research", "data", "scraper"]);
  });
  it("flattens to the existing Command recipe without changing financial objects", () => {
    const m = genesis(),
      flat = authorityLayout(m, 960),
      view = authorityWorldView(m, "scraper", 960, 0);
    view.nodes.forEach((p) => {
      expect([p.x, p.y, p.z]).deep.eq([
        flat.points.get(p.node.id)!.x,
        flat.points.get(p.node.id)!.y,
        0,
      ]);
      expect(p.node).eq(node(m, p.node.id));
    });
  });
  it("bounds twelve impact wires outside Treasury and Operations", () => {
    const view = authorityWorldView(genesis(), "research", 864),
      volume = authorityVolume(view, "research");
    expect(volume).length(12);
    const values = volume.flatMap((d) =>
      d.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
    );
    const xs = values.filter((_, i) => i % 2 === 0),
      ys = values.filter((_, i) => i % 2 === 1);
    const operations = view.nodes.find((p) => p.node.id === "operations")!;
    const root = view.nodes.find((p) => p.node.id === "treasury")!;
    expect(Math.max(...xs)).lessThan(operations.x - operations.width / 2);
    expect(Math.min(...ys)).greaterThan(root.y + root.height);
    expect(view.nodes.every((p) => p.status === "active")).eq(true);
  });
  it("keeps each mobile subtree contiguous before and after a revoke", () => {
    const before = authorityLedger(genesis()).map((n) => n.id);
    expect(before).deep.eq([
      "treasury",
      "research",
      "data",
      "scraper",
      "analysis",
      "operations",
    ]);
    expect(
      authorityLedger(revokeDemo(genesis(), "research")).map((n) => n.id),
    ).deep.eq(before);
  });
  it("keeps canonical node coordinates through construction, trace and revoke", () => {
    const before = authorityLayout(genesis(), 900);
    for (let count = 1; count <= 6; count++) {
      const partial = authorityLayout(genesis(count), 900);
      for (const n of genesis(count).nodes)
        expect(partial.points.get(n.id)).deep.eq(before.points.get(n.id));
    }
    const after = authorityLayout(revokeDemo(genesis(), "research"), 900);
    expect([...after.points]).deep.eq([...before.points]);
    expect(after.points.get("operations")).deep.eq(
      before.points.get("operations"),
    );
  });
  it("fits the canonical last descendant inside the shared field", () => {
    const layout = authorityLayout(genesis(), 900);
    expect(layout.points.get("scraper")!.y + 86).lessThan(layout.height);
    expect(layout.points.get("operations")!.x - 92).greaterThan(
      layout.points.get("analysis")!.x + 92 + 16,
    );
  });
  it("balances the fixture without adding nested envelopes", () => {
    const m = genesis();
    expect(m.nodes.reduce((total, n) => total + n.available, 0n)).eq(m.vault);
    expect(node(m, "treasury").available).eq(u(1000));
    expect(node(m, "research").remaining).eq(u(390));
    expect(node(m, "data").remaining).eq(u(90));
    for (const n of m.nodes)
      expect(n.remaining).eq(
        n.available +
          m.nodes
            .filter((c) => c.parent === n.id)
            .reduce((sum, c) => sum + c.remaining, 0n),
      );
  });
  it("keeps every intermediate genesis state financially balanced", () => {
    for (let count = 1; count <= 6; count++) {
      const m = genesis(count);
      expect(m.nodes.reduce((sum, n) => sum + n.available, 0n)).eq(m.vault);
      expect(m.nodes.every((n) => n.available >= 0n)).eq(true);
    }
  });
  it("cuts local authority, releases to parent, and preserves descendant records", () => {
    const before = genesis(),
      after = revokeDemo(before, "research");
    expect(node(after, "research").local).eq("revoked");
    expect(node(after, "research").available).eq(0n);
    expect(node(after, "research").remaining).eq(0n);
    expect(node(after, "treasury").available).eq(u(1390));
    expect(after.vault).eq(before.vault);
    expect(node(after, "treasury").remaining).eq(u(1590));
    for (const id of ["data", "analysis", "scraper"]) {
      expect(node(after, id)).deep.eq(node(before, id));
      expect(statusOf(after, id)).eq("blocked");
    }
    expect(statusOf(after, "operations")).eq("active");
    expect(() => revokeDemo(after, "research")).throws();
    expect(() => spendDemo(after, "scraper", u(1))).throws();
  });
  it("spends along the complete path and leaves sibling economics intact", () => {
    const before = genesis(),
      after = spendDemo(before, "scraper", u(5));
    expect(authorityPath(after, "scraper").map((n) => n.id)).deep.eq([
      "treasury",
      "research",
      "data",
      "scraper",
    ]);
    for (const id of ["treasury", "research", "data", "scraper"])
      expect(node(after, id).remaining).eq(node(before, id).remaining - u(5));
    expect(node(after, "scraper").available).eq(u(25));
    expect(node(after, "operations")).deep.eq(node(before, "operations"));
    expect(after.vault).eq(u(1585));
    expect(after.spent).eq(u(5));
  });
  it("reclaims only Root available and forbids zero/excess amounts", () => {
    const m = genesis();
    expect(() => spendDemo(m, "research", u(1), true)).throws();
    expect(() => spendDemo(m, "treasury", u(1001), true)).throws();
    expect(() => spendDemo(m, "treasury", 0n, true)).throws();
    const after = spendDemo(m, "treasury", u(20), true);
    expect(after.reclaimed).eq(u(20));
    expect(after.spent).eq(0n);
    expect(node(after, "research")).deep.eq(node(m, "research"));
  });
  it("reserves Arena authority then settles exactly once from the same vault", () => {
    const m = genesis(),
      funded = fundDemoMission(m, u(100));
    expect(node(funded, "treasury").available).eq(u(900));
    expect(funded.vault).eq(m.vault);
    expect(node(funded, "treasury").remaining).eq(u(1590));
    const settled = settleDemoMission(funded, u(100));
    expect(settled.vault).eq(u(1490));
    expect(settled.reserved).eq(0n);
    expect(node(settled, "treasury").remaining).eq(u(1490));
    expect(node(settled, "research")).deep.eq(node(m, "research"));
    expect(() => settleDemoMission(settled, u(100))).throws();
    expect(() => fundDemoMission(m, u(1001))).throws();
  });
  it("never treats incomplete or cyclic authority as active", () => {
    const m = genesis();
    expect(
      statusOf(
        { ...m, nodes: m.nodes.filter((n) => n.id !== "data") },
        "scraper",
      ),
    ).eq("unknown");
    expect(
      statusOf(
        {
          ...m,
          nodes: m.nodes.map((n) =>
            n.id === "data" ? { ...n, parent: "scraper" } : n,
          ),
        },
        "scraper",
      ),
    ).eq("unknown");
    expect(
      statusOf(
        {
          ...m,
          nodes: m.nodes.map((n) => (n.id === "data" ? { ...n, depth: 1 } : n)),
        },
        "scraper",
      ),
    ).eq("unknown");
    expect(statusOf(m, "missing")).eq("unknown");
  });
  it("requires another review when topology, capital, or control changes", () => {
    const m = genesis(),
      key = impactFingerprint(m, "research");
    expect(descendantsOf(m, "research").map((n) => n.id)).deep.eq([
      "data",
      "analysis",
      "scraper",
    ]);
    expect(impactFingerprint(spendDemo(m, "scraper", u(1)), "research")).not.eq(
      key,
    );
    expect(
      impactFingerprint(
        {
          ...m,
          nodes: m.nodes.map((n) =>
            n.id === "scraper" ? { ...n, controller: "changed" } : n,
          ),
        },
        "research",
      ),
    ).not.eq(key);
    expect(
      impactFingerprint(
        { ...m, nodes: m.nodes.filter((n) => n.id !== "scraper") },
        "research",
      ),
    ).not.eq(key);
  });
  it("formats exact base units beyond JavaScript's safe integer range", () => {
    expect(amount(123456789012345678901n)).eq("123,456,789,012,345.678901");
    expect(amount(1000001n)).eq("1.000001");
    expect(amount(0n)).eq("0.00");
    expect(amount(100n, 0)).eq("100.00");
  });
});
