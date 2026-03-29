import * as assert from "assert";
import {
  buildPlantumlGetUrl,
  DEFAULT_PLANTUML_SERVER_URL,
  encodeForPlantumlServer,
  fetchSvgDiagram,
  getUnderlyingFetchErrorCode,
  MAX_PLANTUML_GET_URL_LENGTH,
  normalizeServerBaseUrl,
  plantumlFetchFailureHint,
} from "../../plantuml/serverClient";

suite("plantuml/serverClient", () => {
  test("normalizeServerBaseUrl — vazio usa servidor público por defeito", () => {
    assert.strictEqual(normalizeServerBaseUrl(""), DEFAULT_PLANTUML_SERVER_URL);
    assert.strictEqual(normalizeServerBaseUrl("   "), DEFAULT_PLANTUML_SERVER_URL);
  });

  test("normalizeServerBaseUrl — remove barra final", () => {
    assert.strictEqual(
      normalizeServerBaseUrl("http://exemplo/foo/"),
      "http://exemplo/foo"
    );
  });

  test("normalizeServerBaseUrl — mantém caminho /plantuml (servidor público)", () => {
    assert.strictEqual(
      normalizeServerBaseUrl("https://www.plantuml.com/plantuml"),
      "https://www.plantuml.com/plantuml"
    );
    assert.strictEqual(
      normalizeServerBaseUrl("https://www.plantuml.com/plantuml/"),
      "https://www.plantuml.com/plantuml"
    );
  });

  test("encodeForPlantumlServer — produz texto codificado", () => {
    const encoded = encodeForPlantumlServer("@startuml\nAlice -> Bob\n@enduml\n");
    assert.ok(encoded.length > 4);
  });

  test("getUnderlyingFetchErrorCode — lê cause em cadeia", () => {
    const inner = Object.assign(new Error("connect"), { code: "ECONNREFUSED" });
    const outer = new TypeError("fetch failed");
    Object.assign(outer, { cause: inner });
    assert.strictEqual(getUnderlyingFetchErrorCode(outer), "ECONNREFUSED");
  });

  test("plantumlFetchFailureHint — fetch failed genérico", () => {
    const h = plantumlFetchFailureHint(new TypeError("fetch failed"));
    assert.ok(h.length > 0);
    assert.ok(/localhost|server|port/i.test(h));
    assert.ok(/8081|plantumlViewer/i.test(h));
  });

  test("buildPlantumlGetUrl — diagramas grandes excedem limite GET", () => {
    let pad = "";
    for (;;) {
      const src = `@startuml\n${pad}\n@enduml`;
      const u = buildPlantumlGetUrl("http://127.0.0.1:8080", "svg", src);
      if (u.length > MAX_PLANTUML_GET_URL_LENGTH) {
        assert.ok(true);
        return;
      }
      pad += `${Math.random().toString(36).slice(2)}`;
      if (pad.length > 2_000_000) {
        assert.fail("não foi possível gerar URL GET acima do limite (teste)");
      }
    }
  });
});

suite("plantuml/serverClient — fetch mockado (integração leve)", () => {
  let originalFetch: typeof fetch;

  suiteSetup(() => {
    originalFetch = globalThis.fetch;
  });

  suiteTeardown(() => {
    globalThis.fetch = originalFetch;
  });

  test("GET 404 em /svg/… tenta POST e obtém SVG", async () => {
    let getCalls = 0;
    globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
      const url = typeof input === "string" ? input : String(input);
      if (init?.method === "GET" && url.includes("/svg/")) {
        getCalls += 1;
        return new Response("Not Found", { status: 404 });
      }
      if (init?.method === "POST" && url.endsWith("/svg")) {
        return new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', {
          status: 200,
        });
      }
      return new Response("unexpected", { status: 500 });
    }) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", "@startuml\n@enduml\n");
    assert.strictEqual(getCalls, 1);
    assert.strictEqual(r.kind, "svg");
    if (r.kind === "svg") {
      assert.ok(r.svg.includes("<svg"));
    }
  });

  test("SVG válido retorna kind svg", async () => {
    globalThis.fetch = (async () =>
      new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
        status: 200,
      })) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", "@startuml\n@enduml\n");
    assert.strictEqual(r.kind, "svg");
    if (r.kind === "svg") {
      assert.ok(r.svg.includes("<svg"));
    }
  });

  test("fetch falha com ECONNREFUSED — mensagem inclui dica acionável", async () => {
    const err = new TypeError("fetch failed");
    Object.assign(err, {
      cause: Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      }),
    });
    globalThis.fetch = (async () => {
      throw err;
    }) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", "@startuml\n@enduml\n");
    assert.strictEqual(r.kind, "error");
    if (r.kind === "error") {
      assert.ok(/docker|plantuml-server|8080/i.test(r.message));
      assert.ok(/8081|port/i.test(r.message));
    }
  });

  test("HTTP 404 retorna erro", async () => {
    globalThis.fetch = (async () => new Response("not found", { status: 404 })) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", "@startuml\n@enduml\n");
    assert.strictEqual(r.kind, "error");
    if (r.kind === "error") {
      assert.ok(r.message.includes("404"));
    }
  });

  test("timeout cancela pedido que não completa", async function () {
    this.timeout(5000);
    globalThis.fetch = (async (_input, init) => {
      await new Promise<void>((resolve, reject) => {
        const s = init?.signal;
        if (!s) {
          reject(new Error("missing signal"));
          return;
        }
        if (s.aborted) {
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          return;
        }
        s.addEventListener(
          "abort",
          () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })),
          { once: true }
        );
      });
      return new Response("", { status: 200 });
    }) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", "@startuml\n@enduml\n", {
      timeoutMs: 80,
    });
    assert.strictEqual(r.kind, "error");
    if (r.kind === "error") {
      assert.ok(/timeout|canceled|cancelled|Request/i.test(r.message));
    }
  });

  test("diagrama muito grande usa POST em /svg", async function () {
    this.timeout(60000);
    let pad = "";
    let longBody = "@startuml\n@enduml\n";
    for (;;) {
      longBody = `@startuml\n${pad}\n@enduml\n`;
      const u = buildPlantumlGetUrl("http://127.0.0.1:8080", "svg", longBody);
      if (u.length > MAX_PLANTUML_GET_URL_LENGTH) {
        break;
      }
      pad += `${Math.random().toString(36).slice(2)}`;
      if (pad.length > 2_000_000) {
        assert.fail("não foi possível exceder limite GET no teste");
      }
    }

    let sawPost = false;
    globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
      const url = typeof input === "string" ? input : String(input);
      if (init?.method === "POST" && url.endsWith("/svg")) {
        sawPost = true;
        return new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', { status: 200 });
      }
      return new Response("expected POST", { status: 500 });
    }) as typeof fetch;

    const r = await fetchSvgDiagram("http://127.0.0.1:8080", longBody);
    assert.strictEqual(sawPost, true);
    assert.strictEqual(r.kind, "svg");
  });
});
