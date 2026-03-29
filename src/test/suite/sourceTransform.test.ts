import * as assert from "assert";
import { applyDiagramPreamble } from "../../plantuml/sourceTransform";

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
});
