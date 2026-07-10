import { createPgClient } from "@/lib/pg-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export function createClient() {
  const pgClient = createPgClient();
  return {
    ...pgClient,
    auth: {
      getUser: async () => {
        try {
          const hdrs = await headers();
          const session = await auth.api.getSession({ headers: hdrs });
          return { data: { user: session?.user ?? null }, error: session ? null : new Error("No session") };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
    },
  };
}
