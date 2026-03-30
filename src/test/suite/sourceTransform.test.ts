import * as assert from "assert";
import {
  applyDiagramPreamble,
  applyVisualPreambleAfterTheme,
} from "../../plantuml/sourceTransform";

suite("plantuml/sourceTransform", () => {
  test("applyDiagramPreamble — vazio não altera", () => {
    assert.strictEqual(applyDiagramPreamble("a", ""), "a");
    assert.strictEqual(applyDiagramPreamble("a", "   "), "a");
  });

  test("applyDiagramPreamble — prefixa", () => {
    assert.strictEqual(
      applyDiagramPreamble("@startuml\n@enduml", "!theme plain"),
      "!theme plain\n@startuml\n@enduml"
    );
  });

  test("applyVisualPreambleAfterTheme — insere depois de !theme plain", () => {
    const src = "@startuml\n!theme plain\nAlice -> Bob\n@enduml";
    const out = applyVisualPreambleAfterTheme(src, "skinparam ArrowColor #f00");
    assert.ok(out.indexOf("!theme plain") < out.indexOf("skinparam ArrowColor"));
    assert.ok(out.indexOf("skinparam ArrowColor") < out.indexOf("Alice -> Bob"));
  });

  test("applyVisualPreambleAfterTheme — vazio não altera", () => {
    assert.strictEqual(applyVisualPreambleAfterTheme("a", ""), "a");
  });
});
