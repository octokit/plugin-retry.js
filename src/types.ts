export interface RetryState {
  enabled: boolean;
  retryAfterBaseValue: number;
  doNotRetry: number[];
  retries: number;
}
