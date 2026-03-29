import * as assert from "assert";
import {
  computeNextPreviewZoom,
  computeScrollForZoomAtPoint,
} from "../../util/previewZoomWheel";

suite("previewZoomWheel — computeNextPreviewZoom", () => {
  test("negative deltaY increases zoom (wheel up)", () => {
    const next = computeNextPreviewZoom(1, -100);
    assert.ok(next > 1);
    assert.ok(next <= 3);
  });

  test("positive deltaY decreases zoom (wheel down)", () => {
    const next = computeNextPreviewZoom(1, 100);
    assert.ok(next < 1);
    assert.ok(next >= 0.25);
  });

  test("clamps to max", () => {
    const next = computeNextPreviewZoom(2.9, -5000);
    assert.strictEqual(next, 3);
  });

  test("clamps to min", () => {
    const next = computeNextPreviewZoom(0.26, 5000);
    assert.strictEqual(next, 0.25);
  });

  test("invalid current falls back toward finite range", () => {
    const next = computeNextPreviewZoom(NaN, 0);
    assert.strictEqual(next, 1);
  });
});

suite("previewZoomWheel — computeScrollForZoomAtPoint", () => {
  test("doubles zoom keeps point under (mx,my) fixed", () => {
    const s0 = 1;
    const s1 = 2;
    const scrollLeft = 100;
    const mx = 50;
    const { scrollLeft: sl } = computeScrollForZoomAtPoint(
      scrollLeft,
      0,
      s0,
      s1,
      mx,
      0
    );
    assert.strictEqual(sl, (scrollLeft + mx) * (s1 / s0) - mx);
    assert.strictEqual(sl, 250);
  });

  test("invalid scale returns original scroll", () => {
    const r = computeScrollForZoomAtPoint(10, 20, 0, 2, 5, 5);
    assert.strictEqual(r.scrollLeft, 10);
    assert.strictEqual(r.scrollTop, 20);
  });
});
