import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Run middleware on admin pages, login, and avoid static assets.
  matcher: ["/admin/:path*", "/login"],
};
