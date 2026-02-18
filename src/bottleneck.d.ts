/** Minimal typings for "bottleneck/light.js" based on the usage in this library. */
declare module "bottleneck/light.js" {
  export type RetryableInfo = { readonly retryCount: number };

  export class Bottleneck {
    constructor(options?: any);

    on(name: "failed", fn: (error: any, info: RetryableInfo) => any): void;

    schedule<A extends unknown[], R>(
      task: (...args: A) => Promise<R>,
      ...taskArgs: A
    ): Promise<R>;
  }
  export default Bottleneck;
}
