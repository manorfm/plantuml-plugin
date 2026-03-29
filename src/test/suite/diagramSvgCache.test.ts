import * as assert from "assert";
import {
  clearDiagramSvgCache,
  diagramCacheKey,
  getCachedDiagram,
  setCachedDiagram,
} from "../../plantuml/diagramSvgCache";

suite("plantuml/diagramSvgCache", () => {
  setup(() => {
    clearDiagramSvgCache();
  });

  test("diagramCacheKey is stable for same inputs", () => {
    const a = diagramCacheKey("http://x", "@startuml\n@enduml");
    const b = diagramCacheKey("http://x", "@startuml\n@enduml");
    assert.strictEqual(a, b);
  });

  test("diagramCacheKey differs when body differs", () => {
    const a = diagramCacheKey("http://x", "a");
    const b = diagramCacheKey("http://x", "b");
    assert.notStrictEqual(a, b);
  });

  test("get returns undefined on miss", () => {
    assert.strictEqual(getCachedDiagram("no-such-key"), undefined);
  });

  test("set and get round-trip for svg", () => {
    const k = diagramCacheKey("u", "body");
    setCachedDiagram(k, { kind: "svg", svg: "<svg/>" });
    const g = getCachedDiagram(k);
    assert.ok(g && g.kind === "svg");
    if (g && g.kind === "svg") {
      assert.strictEqual(g.svg, "<svg/>");
    }
  });

  test("stores error kind", () => {
    const k = diagramCacheKey("u", "errbody");
    setCachedDiagram(k, { kind: "err", message: "fail" });
    const g = getCachedDiagram(k);
    assert.ok(g && g.kind === "err");
    if (g && g.kind === "err") {
      assert.strictEqual(g.message, "fail");
    }
  });

  test("evicts oldest entry when at capacity (32)", () => {
    const oldest = diagramCacheKey("cap", "0");
    setCachedDiagram(oldest, { kind: "svg", svg: "a" });
    for (let i = 1; i <= 31; i++) {
      setCachedDiagram(diagramCacheKey("cap", String(i)), {
        kind: "svg",
        svg: "x",
      });
    }
    setCachedDiagram(diagramCacheKey("cap", "32"), { kind: "svg", svg: "y" });
    assert.strictEqual(getCachedDiagram(oldest), undefined);
    assert.ok(getCachedDiagram(diagramCacheKey("cap", "32")));
  });
});
