import * as assert from "assert";
import { analyzeDiagramKind } from "../../plantuml/rendering/analyzeDiagram";
import {
  prepareUmlForServer,
  enhanceSvgString,
  renderDiagram,
} from "../../plantuml/rendering/renderPipeline";
import { postProcessSvg } from "../../plantuml/rendering/svgPostProcess";
import {
  hasNonPlainPlantumlTheme,
  hasUserLayoutSkinparams,
} from "../../plantuml/rendering/visualPreamble";

suite("plantuml/rendering — analyzeDiagramKind", () => {
  test("sequence diagram", () => {
    assert.strictEqual(
      analyzeDiagramKind("@startuml\nparticipant A\nA -> B\n@enduml"),
      "sequence"
    );
  });

  test("class diagram", () => {
    assert.strictEqual(
      analyzeDiagramKind("@startuml\nclass Foo\n@enduml"),
      "class"
    );
  });

  test("component diagram — keyword component antes de package/class", () => {
    assert.strictEqual(
      analyzeDiagramKind(
        "@startuml\npackage X {\n  component [a] <<TypeScript>>\n}\n@enduml"
      ),
      "component"
    );
  });
});

suite("plantuml/rendering — pipeline", () => {
  test("prepareUmlForServer inclui skinparam quando tema ≠ none", () => {
    const { text } = prepareUmlForServer(
      "@startuml\nAlice -> Bob\n@enduml",
      undefined,
      {
        theme: "modern-dark",
        semanticColors: true,
        svgEnhancements: true,
      }
    );
    assert.ok(text.includes("skinparam"));
    assert.ok(text.includes("PlantUML Viewer: visual theme"));
    assert.ok(text.includes("DejaVu Sans"));
    assert.ok(text.includes("ArrowFontSize"));
  });

  test("prepareUmlForServer — none não adiciona bloco visual", () => {
    const { text } = prepareUmlForServer(
      "@startuml\nAlice -> Bob\n@enduml",
      undefined,
      {
        theme: "none",
        semanticColors: false,
        svgEnhancements: false,
      }
    );
    assert.ok(!text.includes("PlantUML Viewer: visual theme"));
  });

  test("prepareUmlForServer — !theme plain + cores; cerulean bloqueia; layout manual mantém estilo", () => {
    const withPlain = prepareUmlForServer(
      "@startuml\n!theme plain\nAlice -> Bob\n@enduml",
      undefined,
      { theme: "modern-dark", semanticColors: true, svgEnhancements: true }
    );
    assert.ok(withPlain.text.includes("PlantUML Viewer: visual theme"));
    assert.ok(withPlain.text.includes("ArrowColor"));
    assert.ok(withPlain.text.indexOf("!theme plain") < withPlain.text.indexOf("PlantUML Viewer"));
    const withCerulean = prepareUmlForServer(
      "@startuml\n!theme cerulean-outline\nAlice -> Bob\n@enduml",
      undefined,
      { theme: "modern-dark", semanticColors: true, svgEnhancements: true }
    );
    assert.ok(!withCerulean.text.includes("PlantUML Viewer: visual theme"));
    const withSep = prepareUmlForServer(
      "skinparam nodesep 50\n@startuml\nAlice -> Bob\n@enduml",
      undefined,
      { theme: "modern-dark", semanticColors: true, svgEnhancements: true }
    );
    assert.ok(withSep.text.includes("PlantUML Viewer: visual theme"));
    assert.ok(withSep.text.includes("style only"));
    assert.ok(!withSep.text.includes("skinparam nodesep 28"));
  });

  test("hasUserLayoutSkinparams e hasNonPlainPlantumlTheme", () => {
    assert.strictEqual(hasUserLayoutSkinparams("!theme plain\n@startuml\n@enduml"), false);
    assert.strictEqual(hasNonPlainPlantumlTheme("!theme plain\n@startuml\n@enduml"), false);
    assert.strictEqual(
      hasNonPlainPlantumlTheme("!theme cerulean-outline\n@startuml\n@enduml"),
      true
    );
    assert.strictEqual(
      hasUserLayoutSkinparams("skinparam ranksep 40\n@startuml\n@enduml"),
      true
    );
    assert.strictEqual(hasUserLayoutSkinparams("@startuml\nAlice -> Bob\n@enduml"), false);
  });

  test("postProcessSvg injects defs", () => {
    const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>`;
    const out = postProcessSvg(raw, "modern-dark", "sequence", true);
    assert.ok(out.includes("pumlvr-shadow"));
    assert.ok(out.includes("<defs"));
    assert.ok(out.includes("font-family:"));
    assert.ok(out.includes("DejaVu Sans"));
  });

  test("postProcessSvg — diagrama denso (component) usa drop-shadow suave, não url(#shadow)", () => {
    const raw = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>`;
    const out = postProcessSvg(raw, "modern-dark", "component", true);
    assert.ok(!out.includes("filter: url(#pumlvr-shadow)"));
    assert.ok(out.includes("drop-shadow("));
    assert.ok(out.includes("<defs"));
  });

  test("prepareUmlForServer — estereótipo <<TypeScript>> gera skinparam por prefixo", () => {
    const { text } = prepareUmlForServer(
      "@startuml\ncomponent [x] <<TypeScript>>\n@enduml",
      undefined,
      { theme: "modern-dark", semanticColors: false, svgEnhancements: true }
    );
    assert.ok(text.includes("component<<TypeScript>>"));
    assert.ok(text.includes("stereotype accents"));
  });

  test("enhanceSvgString respects none", () => {
    const raw = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const out = enhanceSvgString(raw, "other", {
      theme: "none",
      semanticColors: false,
      svgEnhancements: true,
    });
    assert.strictEqual(out, raw);
  });

  test("renderDiagram integra fetch e pós-processamento", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>',
        { status: 200 }
      )) as typeof fetch;
    try {
      const r = await renderDiagram({
        uml: "@startuml\nparticipant Alice\nAlice -> Bob\n@enduml",
        serverUrl: "http://127.0.0.1:8080",
        visual: {
          theme: "glass",
          semanticColors: false,
          svgEnhancements: true,
        },
      });
      assert.strictEqual(r.kind, "svg");
      if (r.kind === "svg") {
        assert.ok(r.svg.includes("<defs"));
        assert.ok(r.svg.includes("pumlvr-"));
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
