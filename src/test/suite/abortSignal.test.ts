import * as assert from "assert";
import { combineWithTimeout } from "../../util/abortSignal";

suite("util/abortSignal", () => {
  test("combineWithTimeout — timeoutMs ≤ 0 devolve o signal original", () => {
    const c = new AbortController();
    assert.strictEqual(combineWithTimeout(c.signal, 0), c.signal);
    assert.strictEqual(combineWithTimeout(c.signal, -1), c.signal);
  });

  test("combineWithTimeout — apenas timeout dispara abort", async function () {
    this.timeout(3000);
    const s = combineWithTimeout(undefined, 40);
    assert.ok(s);
    await new Promise<void>((resolve, reject) => {
      s!.addEventListener("abort", () => resolve(), { once: true });
      setTimeout(() => reject(new Error("timeout não abortou")), 2000);
    });
  });
});
