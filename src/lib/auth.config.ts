import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Only allow same-origin /admin-prefixed callbacks. Used by the middleware
 * authorized() callback when an already-signed-in user lands on /login.
 */
function safeCallback(url: string | null): string {
  if (!url) return "/admin";
  if (!url.startsWith("/admin")) return "/admin";
  if (url.startsWith("//")) return "/admin";
  return url;
}

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h sessions
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isOnAdmin = path.startsWith("/admin");
      const isOnLogin = path === "/login";

      if (isOnAdmin && !isLoggedIn) {
        const login = new URL("/login", request.nextUrl);
        const intended = request.nextUrl.pathname + request.nextUrl.search;
        login.searchParams.set("callbackUrl", intended);
        return Response.redirect(login);
      }

      if (isOnLogin && isLoggedIn) {
        const target = safeCallback(request.nextUrl.searchParams.get("callbackUrl"));
        return Response.redirect(new URL(target, request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: Role; branchId: string | null };
        token.id = u.id;
        token.role = u.role;
        token.branchId = u.branchId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.branchId = token.branchId as string | null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
