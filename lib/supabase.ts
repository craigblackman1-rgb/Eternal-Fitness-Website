import { createPgClient } from "@/lib/pg-client";

let client: ReturnType<typeof createPgClient> | null = null;

function getClient() {
  if (!client) {
    client = createPgClient();
  }
  return client;
}

// Lazily initialized so importing this module never throws at build time.
export const supabase = new Proxy({} as ReturnType<typeof createPgClient>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
