import * as assert from "assert";
import { parseIncludeLine } from "../../plantuml/expandIncludes";

suite("plantuml/expandIncludes — parseIncludeLine", () => {
  test("detecta caminho simples", () => {
    assert.strictEqual(parseIncludeLine("!include styles.puml"), "styles.puml");
    assert.strictEqual(parseIncludeLine("  !include ./parts/a.puml  "), "./parts/a.puml");
  });

  test("ignora linhas normais", () => {
    assert.strictEqual(parseIncludeLine("@startuml"), null);
    assert.strictEqual(parseIncludeLine("Alice -> Bob"), null);
  });

  test("sintaxe <ficheiro> e aspas", () => {
    assert.strictEqual(parseIncludeLine("!include <parts/x.puml>"), "parts/x.puml");
    assert.strictEqual(
      parseIncludeLine('!include "my folder/diagram.puml"'),
      "my folder/diagram.puml"
    );
    assert.strictEqual(parseIncludeLine("!include 'a b.puml'"), "a b.puml");
  });

  test("ignora !includeurl", () => {
    assert.strictEqual(
      parseIncludeLine("!includeurl http://example.com/a.puml"),
      null
    );
  });
});
