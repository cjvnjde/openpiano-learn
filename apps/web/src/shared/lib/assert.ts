export function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    return;
  }

  console.error(message);
  throw new Error(message);
}
