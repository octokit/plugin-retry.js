import { describe, it, expect } from "vitest";
import { defaultShouldRetry } from "../src/error-request.ts";
import { defaultRetryState } from "../src/index.ts";
import { RequestError } from "@octokit/request-error";

describe("defaultShouldRetry", function () {
  it("should re-throw non-RequestError errors", function () {
    try {
      defaultShouldRetry(defaultRetryState, new Error("Re-throw me"));
      throw new Error("Should not reach this point");
    } catch (err: any) {
      expect(err.message).toEqual("Re-throw me");
    }
  });

  it("should re-throw errors without RequestRequestOptions", function () {
    try {
      defaultShouldRetry(
        defaultRetryState,
        new RequestError("Re-throw me", 500, {
          request: { method: "GET", url: "/something", headers: {} },
        }),
      );
      throw new Error("Should not reach this point");
    } catch (err: any) {
      expect(err.message).toEqual("Re-throw me");
    }
  });

  it("returns false for doNotRetry status codes", function () {
    for (const statusCode of defaultRetryState.doNotRetry) {
      const result = defaultShouldRetry(
        defaultRetryState,
        new RequestError("Re-throw me", statusCode, {
          request: {
            method: "GET",
            url: "/something",
            headers: {},
            request: {},
          },
        }),
      );
      expect(result).toBe(false);
    }
  });

  it("returns true for 500 errors", function () {
    const result = defaultShouldRetry(
      defaultRetryState,
      new RequestError("Re-throw me", 500, {
        request: {
          method: "GET",
          url: "/something",
          headers: {},
          request: {},
        },
      }),
    );
    expect(result).toBe(true);
  });
});
