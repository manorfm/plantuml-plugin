import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
} from "../constants/previewZoomLimits";

/**
 * Computes the next preview zoom from a wheel `deltaY` (typical range varies by device).
 * Negative deltaY → zoom in; positive → zoom out.
 */
export function computeNextPreviewZoom(
  current: number,
  deltaY: number,
  min: number = PREVIEW_ZOOM_MIN,
  max: number = PREVIEW_ZOOM_MAX
): number {
  if (!Number.isFinite(current) || current <= 0) {
    current = 1;
  }
  if (!Number.isFinite(deltaY)) {
    return Math.min(max, Math.max(min, current));
  }
  const sensitivity = 0.002;
  const factor = Math.exp(-deltaY * sensitivity);
  let next = current * factor;
  next = Math.min(max, Math.max(min, next));
  return Math.round(next * 1000) / 1000;
}

/**
 * After zoom changes from `s0` to `s1`, new scroll values so the diagram point under
 * the viewport position `(mx, my)` (relative to the scrollport visible top-left) stays fixed.
 */
export function computeScrollForZoomAtPoint(
  scrollLeft: number,
  scrollTop: number,
  s0: number,
  s1: number,
  mx: number,
  my: number
): { scrollLeft: number; scrollTop: number } {
  if (!Number.isFinite(s0) || s0 <= 0 || !Number.isFinite(s1) || s1 <= 0) {
    return { scrollLeft, scrollTop };
  }
  const ratio = s1 / s0;
  return {
    scrollLeft: (scrollLeft + mx) * ratio - mx,
    scrollTop: (scrollTop + my) * ratio - my,
  };
}
