import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Login owns its own full-page split-screen layout. We just provide a theme
  // toggle in the corner over everything.
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
