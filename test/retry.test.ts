import { TestOctokit } from "./octokit";
import { errorRequest } from "../src/error-request";
import { RequestError } from "@octokit/request-error";
import { RequestMethod } from "@octokit/types";

describe("Automatic Retries", function () {
  it("Should be possible to disable the plugin", async function () {
    const octokit = new TestOctokit({ retry: { enabled: false } });

    try {
      await octokit.request("GET /route", {
        request: {
          responses: [
            { status: 403, headers: {}, data: { message: "Did not retry" } },
            { status: 200, headers: {}, data: { message: "Success!" } },
          ],
          retries: 1,
        },
      });
      throw new Error("Should not reach this point");
    } catch (error: any) {
      expect(error.status).toEqual(403);
      expect(error.message).toEqual("Did not retry");
    }

    expect(octokit.__requestLog).toStrictEqual(["START GET /route"]);
  });

  it("Should retry once and pass", async function () {
    const octokit = new TestOctokit();

    const response = await octokit.request("GET /route", {
      request: {
        responses: [
          { status: 403, headers: {}, data: { message: "Did not retry" } },
          { status: 200, headers: {}, data: { message: "Success!" } },
        ],
        retries: 1,
      },
    });

    expect(response.status).toEqual(200);
    expect(response.data).toStrictEqual({ message: "Success!" });
    expect(octokit.__requestLog).toStrictEqual([
      "START GET /route",
      "START GET /route",
      "END GET /route",
    ]);

    expect(
      octokit.__requestTimings[1] - octokit.__requestTimings[0]
    ).toBeLessThan(20);
  });

  it("Should retry twice and fail", async function () {
    const octokit = new TestOctokit();

    try {
      await octokit.request("GET /route", {
        request: {
          responses: [
            { status: 403, headers: {}, data: { message: "ONE" } },
            { status: 403, headers: {}, data: { message: "TWO" } },
            { status: 401, headers: {}, data: { message: "THREE" } },
          ],
          retries: 2,
        },
      });
      throw new Error("Should not reach this point");
    } catch (error: any) {
      expect(error.status).toEqual(401);
      expect(error.message).toEqual("THREE");
    }
    expect(octokit.__requestLog).toStrictEqual([
      "START GET /route",
      "START GET /route",
      "START GET /route",
    ]);
    expect(
      octokit.__requestTimings[1] - octokit.__requestTimings[0]
    ).toBeLessThan(20);
    expect(
      octokit.__requestTimings[2] - octokit.__requestTimings[1]
    ).toBeLessThan(20);
  });

  it("Should retry after 2000ms", async function () {
    const octokit = new TestOctokit({ retry: { retryAfterBaseValue: 50 } });

    const response = await octokit.request("GET /route", {
      request: {
        responses: [
          { status: 403, headers: {}, data: {} },
          { status: 202, headers: {}, data: { message: "Yay!" } },
        ],
        retries: 1,
        retryAfter: 2,
      },
    });

    expect(response.status).toEqual(202);
    expect(response.data).toStrictEqual({ message: "Yay!" });
    expect(octokit.__requestLog).toStrictEqual([
      "START GET /route",
      "START GET /route",
      "END GET /route",
    ]);
    // 50ms * 2 === 100ms
    const ms = octokit.__requestTimings[1] - octokit.__requestTimings[0];
    expect(ms).toBeGreaterThan(80);
    expect(ms).toBeLessThan(120);
  });

  it("Should allow end users to see the number of retries after a failure", async function () {
    const octokit = new TestOctokit({ retry: { retryAfterBaseValue: 25 } });

    try {
      await octokit.request("GET /route", {
        request: {
          responses: [
            { status: 403, headers: {}, data: { message: "Failed, one" } },
            { status: 403, headers: {}, data: { message: "Failed, two" } },
            { status: 403, headers: {}, data: { message: "Failed, three" } },
            { status: 403, headers: {}, data: { message: "Failed, four" } },
          ],
          retries: 3,
        },
      });
      throw new Error("Should not reach this point");
    } catch (error: any) {
      expect(error.message).toEqual("Failed, four");
      expect(error.request.request.retryCount).toEqual(4);
    }

    // null (0) retryAfter
    expect(
      octokit.__requestTimings[3] - octokit.__requestTimings[2]
    ).toBeLessThan(20);
  });

  it("Should allow end users to request retries", async function () {
    const octokit = new TestOctokit({ retry: { retryAfterBaseValue: 25 } });

    const response = await octokit.request("GET /route", {
      request: {
        responses: [
          { status: 403, headers: {}, data: { message: "Did not retry" } },
          { status: 202, headers: {}, data: { message: "Yay!" } },
        ],
        retries: 1,
        retryAfter: 1,
      },
    });

    expect(response.status).toEqual(202);
    expect(response.data).toStrictEqual({ message: "Yay!" });
    expect(octokit.__requestLog).toStrictEqual([
      "START GET /route",
      "START GET /route",
      "END GET /route",
    ]);

    const ms = octokit.__requestTimings[1] - octokit.__requestTimings[0];
    expect(ms).toBeLessThan(45);
  });

  it("Should trigger exponential retries on HTTP 500 errors", async function () {
    const octokit = new TestOctokit({ retry: { retryAfterBaseValue: 50 } });

    const res = await octokit.request("GET /route", {
      request: {
        responses: [
          { status: 500, headers: {}, data: { message: "Did not retry, one" } },
          { status: 500, headers: {}, data: { message: "Did not retry, two" } },
          {
            status: 500,
            headers: {},
            data: { message: "Did not retry, three" },
          },
          { status: 200, headers: {}, data: { message: "Success!" } },
        ],
      },
    });

    expect(res.status).toEqual(200);
    expect(res.data).toStrictEqual({ message: "Success!" });
    expect(octokit.__requestLog).toStrictEqual([
      "START GET /route",
      "START GET /route",
      "START GET /route",
      "START GET /route",
      "END GET /route",
    ]);

    const ms0 = octokit.__requestTimings[1] - octokit.__requestTimings[0];
    expect(ms0).toBeLessThan(70);
    expect(ms0).toBeGreaterThan(30);

    const ms1 = octokit.__requestTimings[2] - octokit.__requestTimings[1];
    expect(ms1).toBeLessThan(220);
    expect(ms1).toBeGreaterThan(180);

    const ms2 = octokit.__requestTimings[3] - octokit.__requestTimings[2];
    expect(ms2).toBeLessThan(470);
    expect(ms2).toBeGreaterThan(420);
  });

  it("Should not retry 3xx/400/401/403/422 errors", async function () {
    const octokit = new TestOctokit({ retry: { retryAfterBaseValue: 50 } });
    let caught = 0;
    const testStatuses = [304, 400, 401, 403, 404, 422];

    for (const status of testStatuses) {
      try {
        await octokit.request("GET /route", {
          request: {
            responses: [
              { status, headers: {}, data: { message: `Error ${status}` } },
              { status: 500, headers: {}, data: { message: "Error 500" } },
            ],
          },
        });
      } catch (error: any) {
        expect(error.message).toEqual(`Error ${status}`);
        caught++;
      }
    }

    expect(caught).toEqual(testStatuses.length);
    expect(octokit.__requestLog).toStrictEqual(
      testStatuses.map((x) => "START GET /route")
    );
  });

  it("Should allow to override the doNotRetry list", async function () {
    const octokit = new TestOctokit({
      retry: {
        doNotRetry: [400],
        retries: 1,
        retryAfterBaseValue: 50,
      },
    });
    let caught = 0;
    const testStatuses = [304, 400, 401, 403, 404];

    for (const status of testStatuses) {
      try {
        await octokit.request("GET /route", {
          request: {
            responses: [
              { status, headers: {}, data: { message: `Error ${status}` } },
              { status: 500, headers: {}, data: { message: "Error 500" } },
            ],
          },
        });
      } catch (error: any) {
        if (status === 400 || status < 400) {
          expect(error.message).toEqual(`Error ${status}`);
        } else {
          expect(error.message).toEqual("Error 500");
        }
        caught++;
      }
    }

    expect(caught).toEqual(testStatuses.length);
  });

  it('Should retry "Something went wrong" GraphQL error', async function () {
    const octokit = new TestOctokit();

    const result = await octokit.graphql({
      query: `query { 
          viewer { 
            login
          }
        }`,
      request: {
        responses: [
          {
            status: 200,
            headers: {},
            data: {
              errors: [
                {
                  message:
                    // the `0000:0000:0000000:0000000:00000000` part is variable, it's the request ID provided by GitHub
                    "Something went wrong while executing your query. Please include `0000:0000:0000000:0000000:00000000` when reporting this issue.",
                },
              ],
            },
          },
          {
            status: 200,
            headers: {},
            data: {
              data: {
                viewer: {
                  login: "gr2m",
                },
              },
            },
          },
        ],
        retries: 1,
      },
    });

    expect(result).toStrictEqual({
      viewer: {
        login: "gr2m",
      },
    });
    expect(octokit.__requestLog).toStrictEqual([
      "START POST /graphql",
      "END POST /graphql",
      "START POST /graphql",
      "END POST /graphql",
    ]);

    expect(
      octokit.__requestTimings[1] - octokit.__requestTimings[0]
    ).toBeLessThan(20);
  });

  it("Should not throw for empty responses", async function () {
    const octokit = new TestOctokit();

    const response = await octokit.request("GET /test", {
      request: {
        responses: [
          {
            status: 200,
            headers: {},
            data: undefined,
          },
        ],
        retries: 1,
      },
    });

    expect(response.data).toBeUndefined();
  });

  it('Should not retry non-"Something went wrong" GraphQL errors', async function () {
    const octokit = new TestOctokit();

    try {
      await octokit.graphql({
        query: `query { 
          viewer { 
            login
          }
        }`,
        request: {
          responses: [
            {
              status: 200,
              headers: {},
              data: {
                errors: [
                  {
                    message:
                      "Something that cannot be fixed with a request retry",
                  },
                ],
              },
            },
            {
              status: 200,
              headers: {},
              data: {
                data: {
                  viewer: {
                    login: "gr2m",
                  },
                },
              },
            },
          ],
          retries: 1,
        },
      });
      throw new Error("Should not reach this point");
    } catch (error: any) {
      expect(error.name).toEqual("GraphqlResponseError");
      expect(error.message).toContain(
        "Something that cannot be fixed with a request retry"
      );
    }

    expect(octokit.__requestLog).toStrictEqual([
      "START POST /graphql",
      "END POST /graphql",
    ]);

    expect(
      octokit.__requestTimings[1] - octokit.__requestTimings[0]
    ).toBeLessThan(20);
  });
});

describe("errorRequest", function () {
  it("Should rethrow the error if there's no request property", async function () {
    const octokit = new TestOctokit();
    const state = {
      enabled: true,
      retryAfterBaseValue: 1000,
      doNotRetry: [400, 401, 403, 404, 422],
      retries: 3,
    };
    const errorOptions = {
      request: {
        method: "GET" as RequestMethod,
        url: "/issues",
        headers: {},
        retries: 5,
        request: {},
      },
    };
    const error = new RequestError(
      "Internal server error",
      500,
      errorOptions
    ) as any;
    delete error.request;

    try {
      await errorRequest(state, octokit, error, errorOptions);
      expect(1).not.toBe(1);
    } catch (e: any) {
      expect(e).toBe(error);
    }
  });

  it("should override the state.retries property with the options.request.retries properties", async function () {
    const octokit = new TestOctokit();
    const state = {
      enabled: true,
      retryAfterBaseValue: 1000,
      doNotRetry: [400, 401, 403, 404, 422],
      retries: 3,
    };
    const errorOptions = {
      request: {
        method: "GET" as RequestMethod,
        url: "/issues",
        headers: {},
        retries: 5,
        request: {},
      },
    };

    const error = new RequestError("Internal server error", 500, errorOptions);

    try {
      await errorRequest(state, octokit, error, errorOptions);
      expect(1).not.toBe(1);
    } catch (e: any) {
      expect(e.request.retries).toBe(5);
    }
  });
});
