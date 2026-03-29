import * as assert from "assert";
import { formatPlantumlSource } from "../../plantuml/formatPlantuml";

suite("formatPlantumlSource", () => {
  const opts = { tabSize: 2, insertSpaces: true };

  test("trim trailing space and ensure final newline", () => {
    const input = "  @startuml\nAlice -> Bob  \n@enduml";
    const out = formatPlantumlSource(input, opts);
    assert.ok(out.endsWith("\n") || out.endsWith("\r\n"));
    assert.ok(!out.includes("Bob  "));
  });

  test("indent alt / else / end block", () => {
    const input = [
      "@startuml",
      "alt case",
      "A -> B",
      "else",
      "C -> D",
      "end",
      "@enduml",
    ].join("\n");
    const out = formatPlantumlSource(input, opts);
    assert.ok(out.includes("  A -> B"), "branch body indented");
    assert.ok(out.includes("  C -> D"), "else branch indented");
  });

  test("brace blocks change depth", () => {
    const input = "@startuml\nskinparam foo {\nbar baz\n}\n@enduml";
    const out = formatPlantumlSource(input, opts);
    assert.ok(out.includes("  bar baz"), "inner line indented");
  });
});
