import * as assert from "assert";
import { sanitizeSvgForInline } from "../../preview/html";

suite("preview/html — sanitizeSvgForInline", () => {
  test("remove blocos script", () => {
    const raw = `<svg><script>alert(1)</script><text>x</text></svg>`;
    assert.ok(!sanitizeSvgForInline(raw).includes("script"));
    assert.ok(sanitizeSvgForInline(raw).includes("<text>"));
  });

  test("remove declaração XML", () => {
    const raw = `<?xml version="1.0"?><svg></svg>`;
    assert.ok(!sanitizeSvgForInline(raw).includes("<?xml"));
    assert.ok(sanitizeSvgForInline(raw).startsWith("<svg"));
  });
});
