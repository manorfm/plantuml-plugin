export function debounce(
  fn: () => void,
  ms: number
): (() => void) & { dispose: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, ms);
  }) as (() => void) & { dispose: () => void };

  wrapped.dispose = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return wrapped;
}
