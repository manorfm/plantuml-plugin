import * as assert from "assert";
import {
  buildDiagramLoadingMountContent,
  buildDiagramMountContent,
  buildLoadingHtml,
  buildPreviewHtml,
  sanitizeSvgForInline,
} from "../../preview/html";

suite("preview/html — sanitizeSvgForInline", () => {
  test("remove blocos script", () => {
    const raw = `<svg><script>alert(1)</script><text>x</text></svg>`;
    assert.ok(!sanitizeSvgForInline(raw).includes("script"));
    assert.ok(sanitizeSvgForInline(raw).includes("<text>"));
  });

  test("remove declaração XML", () => {
    const raw = `<?xml version="1.0"?><svg></svg>`;
    assert.ok(!sanitizeSvgForInline(raw).includes("<?xml"));
    assert.ok(sanitizeSvgForInline(raw).startsWith("<svg"));
  });
});

suite("preview/html — buildPreviewHtml / mount fragments", () => {
  test("buildPreviewHtml — erro escapa HTML", () => {
    const h = buildPreviewHtml({ error: '<bad>&"' });
    assert.ok(h.includes("<!DOCTYPE html>"));
    assert.ok(h.includes("&lt;bad&gt;&amp;&quot;"));
    assert.ok(!h.includes("<bad>"));
  });

  test("buildPreviewHtml — SVG inclui scrollport e zoom", () => {
    const h = buildPreviewHtml(
      { svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>x</text></svg>' },
      { previewZoom: 1.5 }
    );
    assert.ok(h.includes("scrollport"));
    assert.ok(h.includes("zoom: 1.5"));
  });

  test("buildDiagramMountContent — erro e SVG", () => {
    const err = buildDiagramMountContent({ error: "fail" });
    assert.ok(err.includes("wrap"));
    assert.ok(err.includes("fail"));
    const ok = buildDiagramMountContent({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    });
    assert.ok(ok.includes("diagram-scrollport"));
    assert.ok(ok.includes("zoom-layer"));
  });

  test("buildLoadingHtml e buildDiagramLoadingMountContent", () => {
    const full = buildLoadingHtml("Wait…");
    assert.ok(full.includes("<!DOCTYPE html>"));
    assert.ok(full.includes("Wait"));
    const frag = buildDiagramLoadingMountContent("Loading…");
    assert.ok(frag.includes("Loading"));
    assert.ok(frag.includes("spinner"));
  });
});
