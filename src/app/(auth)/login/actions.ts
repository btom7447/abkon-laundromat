"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  // Optional 2FA code — six-digit TOTP or recovery code. Surfaced when the
  // resolved user has 2FA enabled.
  mfaCode: z.string().nullable().optional(),
  // FormData.get() returns null for missing fields — accept both null and the
  // optional case so zod doesn't reject the whole submission on an absent
  // hidden callbackUrl input.
  callbackUrl: z.string().nullable().optional(),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Signal to the client that the user has 2FA enabled and we need the code. */
  mfaRequired?: boolean;
  /** Echo back the credentials we already accepted so the client can re-submit. */
  email?: string;
};

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
    mfaCode: formData.get("mfaCode"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const redirectTo = safeCallback(parsed.data.callbackUrl);
  const email = parsed.data.email.toLowerCase();

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      mfaCode: parsed.data.mfaCode ?? "",
      redirectTo,
    });
  } catch (err) {
    // Auth.js wraps thrown errors from `authorize` inside CallbackRouteError —
    // the inner cause carries our `MFA_REQUIRED` / `MFA_INVALID` message.
    if (err instanceof AuthError) {
      const cause = (err as AuthError & { cause?: { err?: Error } }).cause;
      const innerMessage = cause?.err?.message ?? "";

      if (innerMessage === "MFA_REQUIRED") {
        return {
          mfaRequired: true,
          email,
        };
      }
      if (innerMessage === "MFA_INVALID") {
        return {
          mfaRequired: true,
          email,
          fieldErrors: { mfaCode: ["Code didn't match. Try again."] },
        };
      }
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
