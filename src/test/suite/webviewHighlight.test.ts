import * as assert from "assert";
import {
  escapeHtml,
  highlightPlantumlLine,
  highlightPlantumlToHtml,
} from "../../plantuml/webviewHighlight";

suite("webviewHighlight", () => {
  test("escapeHtml escapes markup", () => {
    assert.strictEqual(escapeHtml("<a>"), "&lt;a&gt;");
    assert.strictEqual(escapeHtml("A & B"), "A &amp; B");
  });

  test("full-line apostrophe comment", () => {
    const h = highlightPlantumlLine("  ' note");
    assert.ok(h.includes("puml-cmt"));
    assert.ok(h.includes("note"));
    assert.ok(!h.includes("<note"));
  });

  test("keywords and arrows get spans", () => {
    const h = highlightPlantumlLine("Alice -> Bob : ok");
    assert.ok(h.includes("puml-arrow"));
    assert.ok(h.includes("Alice"));
  });

  test("highlightPlantumlToHtml joins lines", () => {
    const h = highlightPlantumlToHtml("@startuml\n@enduml");
    assert.ok(h.includes("<br/>"));
    assert.ok(h.includes("puml-at"));
  });

  test("very large documents use plain escape path", () => {
    const lines = Array.from({ length: 8001 }, () => "a");
    const h = highlightPlantumlToHtml(lines.join("\n"));
    assert.ok(h.includes("puml-plain"));
    assert.ok(!h.includes("puml-kw"));
  });
});
