import * as assert from "assert";
import { getPlantumlCustomEditorShellHtml } from "../../plantuml/customEditorHtml";
import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
} from "../../constants/previewZoomLimits";

suite("plantuml/customEditorHtml — getPlantumlCustomEditorShellHtml", () => {
  test("documento HTML válido com CSP, áreas principais e limites de zoom no script", () => {
    const html = getPlantumlCustomEditorShellHtml();
    assert.ok(html.startsWith("<!DOCTYPE html>"));
    assert.ok(html.includes("Content-Security-Policy"));
    assert.ok(html.includes("default-src 'none'"));
    assert.ok(html.includes('id="diagramMount"'));
    assert.ok(html.includes('id="src"'));
    assert.ok(html.includes('type: "ready"'));
    assert.ok(html.includes(`var minZ = ${PREVIEW_ZOOM_MIN}`));
    assert.ok(html.includes(`var maxZ = ${PREVIEW_ZOOM_MAX}`));
    assert.ok(html.includes("previewZoomChange"));
  });
});
