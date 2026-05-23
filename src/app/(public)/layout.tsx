export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Landing page owns its own header + footer (matches the design's marketing chrome).
  return <div className="min-h-screen bg-background">{children}</div>;
}
