/**
 * Testes de fronteiras de módulo (estilo ArchUnit): imports proibidos e grafo sem ciclos.
 * Alinhado a docs/architecture-diagrams.md e .cursor/rules/extension-architecture.mdc.
 * Corre em Node (subset de cobertura); não carrega vscode.
 */
import * as assert from "assert";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import madge from "madge";

const projectRoot = path.resolve(__dirname, "../../..");
const srcRoot = path.join(projectRoot, "src");

function extractStaticImportPaths(source: string): string[] {
  const out: string[] = [];
  const fromRe = /\bfrom\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(source)) !== null) {
    out.push(m[1]);
  }
  const sideRe = /^\s*import\s+['"]([^'"]+)['"]\s*;/gm;
  while ((m = sideRe.exec(source)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function assertFileMustNotImportSubstring(
  relativePathUnderSrc: string,
  forbiddenSubstring: string,
  reason: string
): void {
  const full = path.join(srcRoot, relativePathUnderSrc);
  const text = fs.readFileSync(full, "utf8");
  for (const imp of extractStaticImportPaths(text)) {
    assert.ok(
      !imp.includes(forbiddenSubstring),
      `${reason}\n  file: ${relativePathUnderSrc}\n  import: ${imp}`
    );
  }
}

suite("architecture — forbidden imports (decoupling)", () => {
  const forbidden = "plantumlCustomEditorProvider";
  const cases: [string, string][] = [
    [
      "plantuml/exportDiagram.ts",
      "export must not depend on custom editor provider (use plantumlEditorSessionRegistry)",
    ],
    [
      "plantuml/plantumlEditorSessionRegistry.ts",
      "session registry must not depend on custom editor provider",
    ],
    [
      "plantuml/plantumlFormatting.ts",
      "formatting must not depend on custom editor provider (use session registry)",
    ],
    [
      "plantumlStatusBar.ts",
      "status bar must not depend on custom editor provider (use session registry)",
    ],
  ];

  for (const [file, reason] of cases) {
    test(`${file}`, () => {
      assertFileMustNotImportSubstring(file, forbidden, reason);
    });
  }

  test("plantuml/rendering/*.ts — none import custom editor provider", () => {
    const files = glob.sync("plantuml/rendering/**/*.ts", {
      cwd: srcRoot,
      nodir: true,
    });
    assert.ok(files.length > 0, "expected plantuml/rendering/**/*.ts");
    for (const f of files) {
      assertFileMustNotImportSubstring(
        f,
        forbidden,
        "rendering pipeline must not depend on plantumlCustomEditorProvider"
      );
    }
  });
});

suite("architecture — layering (HTTP independent of rendering)", () => {
  test("plantuml/serverClient.ts does not import rendering/", () => {
    assertFileMustNotImportSubstring(
      "plantuml/serverClient.ts",
      "rendering",
      "serverClient must stay independent of plantuml/rendering (pipeline imports serverClient)"
    );
  });
});

suite("architecture — no circular TypeScript dependencies (src/)", () => {
  test("madge reports zero cycles", async () => {
    const res = await madge(path.join(projectRoot, "src"), {
      fileExtensions: ["ts"],
      tsConfig: path.join(projectRoot, "tsconfig.json"),
    });
    const circular = res.circular() as unknown[];
    assert.deepStrictEqual(
      circular,
      [],
      `Circular dependencies in src/:\n${JSON.stringify(circular, null, 2)}`
    );
  });
});
