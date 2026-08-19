export async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return (await kv.get(key, "json")) as T | null;
}

export async function putJson(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}
