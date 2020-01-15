import { retry } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(retry).toBeInstanceOf(Function);
  });

  it("retry.VERSION is set", () => {
    expect(retry.VERSION).toEqual("0.0.0-development");
  });
});
