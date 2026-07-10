import { betterAuth } from "better-auth";
import { Pool } from "pg";

const _cs = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: _cs,
  ssl: _cs && !/127\.0\.0\.1|localhost/.test(_cs) ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});

export type Auth = typeof auth;
