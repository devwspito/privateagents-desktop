import type { BaseApiClient } from "./base"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiClientConstructor<T = BaseApiClient> = new (...args: any[]) => T
