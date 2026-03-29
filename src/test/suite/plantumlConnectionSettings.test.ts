import * as assert from "assert";
import {
  normalizePlantumlViewerSettings,
} from "../../plantuml/plantumlConnectionSettings";
import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
} from "../../constants/previewZoomLimits";
import { DEFAULT_PLANTUML_SERVER_URL } from "../../plantuml/serverClient";

suite("plantuml/plantumlConnectionSettings — normalizePlantumlViewerSettings", () => {
  test("serverUrl vazio usa URL por defeito", () => {
    const c = normalizePlantumlViewerSettings({});
    assert.strictEqual(c.serverUrl, DEFAULT_PLANTUML_SERVER_URL);
  });

  test("serverUrl com espaços é trimado; vazio → defeito", () => {
    assert.strictEqual(
      normalizePlantumlViewerSettings({ serverUrl: "   " }).serverUrl,
      DEFAULT_PLANTUML_SERVER_URL
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ serverUrl: " https://x/y/ " }).serverUrl,
      "https://x/y/"
    );
  });

  test("previewZoom NaN ou ausente → 1 e clamp ao intervalo", () => {
    assert.strictEqual(
      normalizePlantumlViewerSettings({ previewZoom: Number.NaN }).previewZoom,
      1
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ previewZoom: 99 }).previewZoom,
      PREVIEW_ZOOM_MAX
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ previewZoom: 0.01 }).previewZoom,
      PREVIEW_ZOOM_MIN
    );
  });

  test("requestTimeoutMs inválido → 45000", () => {
    assert.strictEqual(
      normalizePlantumlViewerSettings({ requestTimeoutMs: Number.NaN })
        .requestTimeoutMs,
      45_000
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ requestTimeoutMs: 0 }).requestTimeoutMs,
      45_000
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ requestTimeoutMs: 12_000 }).requestTimeoutMs,
      12_000
    );
  });

  test("autoRefreshDelayMs inválido → 500 depois clamp 50–30000", () => {
    assert.strictEqual(
      normalizePlantumlViewerSettings({ autoRefreshDelayMs: Number.NaN })
        .autoRefreshDelayMs,
      500
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ autoRefreshDelayMs: 10 }).autoRefreshDelayMs,
      50
    );
    assert.strictEqual(
      normalizePlantumlViewerSettings({ autoRefreshDelayMs: 99_000 })
        .autoRefreshDelayMs,
      30_000
    );
  });

  test("diagramPreamble e booleanos com defaults", () => {
    const d = normalizePlantumlViewerSettings({
      diagramPreamble: "!theme plain",
      autoRefresh: false,
      showModeCodeLens: true,
      showWebviewToolbar: false,
    });
    assert.strictEqual(d.diagramPreamble, "!theme plain");
    assert.strictEqual(d.autoRefresh, false);
    assert.strictEqual(d.showModeCodeLens, true);
    assert.strictEqual(d.showWebviewToolbar, false);
  });
});
