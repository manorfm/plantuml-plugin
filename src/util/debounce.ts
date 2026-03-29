export function debounce(
  fn: () => void,
  ms: number | (() => number)
): (() => void) & { dispose: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const delayMs = (): number => {
    const v = typeof ms === "function" ? ms() : ms;
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  const wrapped = (() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, delayMs());
  }) as (() => void) & { dispose: () => void };

  wrapped.dispose = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return wrapped;
}
