type AsyncReturnType<T extends (...args: never) => Promise<unknown>> =
  T extends (...args: any) => Promise<infer R> ? R : unknown;
