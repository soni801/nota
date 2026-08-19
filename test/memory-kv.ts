export class MemoryKV {
  private store = new Map<string, string>();

  async get(
    key: string,
    type?: "text" | "json" | "arrayBuffer" | "stream",
  ): Promise<string | unknown | null> {
    const value = this.store.get(key);
    if (value === undefined) return null;
    if (type === "json") return JSON.parse(value);
    return value;
  }

  async put(key: string, value: string | ArrayBuffer): Promise<void> {
    const text = typeof value === "string" ? value : new TextDecoder().decode(value);
    this.store.set(key, text);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list() {
    const keys = [...this.store.keys()].map((name) => ({ name }));
    return { keys, list_complete: true, cacheStatus: null };
  }
}
