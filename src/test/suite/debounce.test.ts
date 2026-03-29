import * as assert from "assert";
import { debounce } from "../../util/debounce";

suite("util/debounce", () => {
  test("invokes fn after delay (numeric ms)", (done) => {
    let calls = 0;
    const d = debounce(() => {
      calls++;
    }, 15);
    d();
    assert.strictEqual(calls, 0);
    setTimeout(() => {
      assert.strictEqual(calls, 1);
      done();
    }, 40);
  });

  test("coalesces rapid calls into one", (done) => {
    let calls = 0;
    const d = debounce(() => {
      calls++;
    }, 20);
    d();
    d();
    d();
    setTimeout(() => {
      assert.strictEqual(calls, 1);
      done();
    }, 50);
  });

  test("delay from function", (done) => {
    let calls = 0;
    const d = debounce(() => {
      calls++;
    }, () => 12);
    d();
    setTimeout(() => {
      assert.strictEqual(calls, 1);
      done();
    }, 40);
  });

  test("dispose cancels pending invocation", (done) => {
    let calls = 0;
    const d = debounce(() => {
      calls++;
    }, 50);
    d();
    d.dispose();
    setTimeout(() => {
      assert.strictEqual(calls, 0);
      done();
    }, 70);
  });
});
