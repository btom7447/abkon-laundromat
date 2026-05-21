import { z } from "zod";

/**
 * Env schema. Validated at module load.
 *
 * During production runtime, missing required vars throw. During development
 * and build, validation errors are logged but the process continues so that
 * `next build` works before infra is fully wired up.
 *
 * Set `SKIP_ENV_VALIDATION=true` to bypass all validation (CI, dockerfile build steps).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().min(1).default("Abkon Laundromat"),

  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_TRUST_HOST: z.string().optional().transform((v) => v === "true"),

  TERMII_API_KEY: z.string().optional().default(""),
  TERMII_SENDER_ID: z.string().optional().default("Abkon"),
  TERMII_BASE_URL: z.string().url().optional().default("https://api.ng.termii.com"),

  META_WHATSAPP_PHONE_ID: z.string().optional().default(""),
  META_WHATSAPP_ACCESS_TOKEN: z.string().optional().default(""),
  META_WHATSAPP_VERIFY_TOKEN: z.string().optional().default(""),
  META_WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(""),
  META_APP_SECRET: z.string().optional().default(""),

  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().optional().default("abkon-backups"),
  R2_ENDPOINT: z.string().optional().default(""),

  ADMIN_IP_ALLOWLIST: z.string().optional().default(""),
  LOGIN_RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(900),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

const skipValidation = process.env.SKIP_ENV_VALIDATION === "true";
const parsed = envSchema.safeParse(process.env);

if (!parsed.success && !skipValidation) {
  console.error(
    "⚠️  Invalid environment variables:\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration. See errors above.");
  }
}

type Env = z.infer<typeof envSchema>;

export const env: Env = parsed.success
  ? parsed.data
  : ({
      ...envSchema.parse({
        NODE_ENV: process.env.NODE_ENV ?? "development",
        APP_URL: process.env.APP_URL ?? "http://localhost:3000",
        DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/abkon",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "placeholder-set-a-real-32-character-secret",
      }),
    } as Env);
