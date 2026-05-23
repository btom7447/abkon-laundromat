import { NextResponse } from "next/server";
import { setThemePreferenceAction } from "@/server/actions/profile";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const theme = (body as { theme?: unknown })?.theme;
  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    return NextResponse.json({ ok: false, error: "Invalid theme" }, { status: 400 });
  }
  try {
    const result = await setThemePreferenceAction(theme);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Not signed in — silently no-op so signed-out theme changes still work
    // client-side via localStorage.
    return NextResponse.json({ ok: true, persisted: false });
  }
}
