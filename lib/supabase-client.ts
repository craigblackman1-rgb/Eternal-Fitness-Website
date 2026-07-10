import { authClient } from "@/lib/auth-client";

/**
 * Browser-side client. Data queries (.from()) cannot run in the browser — use
 * server API routes instead. Auth operations (getUser, signOut) are wired to
 * Better Auth's browser client.
 */
export function createClient() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (_table: string): any => {
      throw new Error(
        "Browser data queries via .from() are no longer supported. Use a server API route with the pg shim instead.",
      );
    },
    auth: {
      getUser: async () => {
        const session = await authClient.getSession();
        return { data: { user: session?.data?.user ?? null }, error: session.error };
      },
      signOut: async () => {
        await authClient.signOut();
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const { error } = await authClient.signIn.email({ email, password });
        return { error };
      },
    },
  };
}
