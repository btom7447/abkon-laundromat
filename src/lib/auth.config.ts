import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

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

      if (isOnAdmin && !isLoggedIn) return false;
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", request.nextUrl));
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
