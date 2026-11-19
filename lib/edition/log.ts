// Prints what the paper is working on, and how long each part took.
export async function step<T>(label: string, work: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`… ${label}`);
  const result = await work();
  console.log(`✓ ${label} (${Math.round((Date.now() - start) / 1000)}s)`);
  return result;
}
