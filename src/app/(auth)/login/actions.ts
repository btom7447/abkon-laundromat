"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  // FormData.get() returns null for missing fields — accept both null and the
  // optional case so zod doesn't reject the whole submission on an absent
  // hidden callbackUrl input.
  callbackUrl: z.string().nullable().optional(),
});

export type LoginState = { error?: string; fieldErrors?: Record<string, string[]> };

/**
 * Only allow same-origin, /admin-prefixed redirects. Anything else falls back
 * to /admin to prevent open-redirect attacks.
 */
function safeCallback(url: string | undefined | null): string {
  if (!url) return "/admin";
  if (!url.startsWith("/admin")) return "/admin";
  if (url.startsWith("//")) return "/admin";
  return url;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const redirectTo = safeCallback(parsed.data.callbackUrl);

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Sign-in failed. Please try again." };
    }
    // Auth.js throws a redirect — let it propagate
    throw err;
  }

  return {};
}
