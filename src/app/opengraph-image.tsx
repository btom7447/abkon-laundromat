import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Abkon Laundromat — Clean clothes, done right";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B1226 0%, #21304A 50%, #0284C7 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: 80,
          position: "relative",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "6px solid #FFFFFF",
            marginBottom: 32,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 100 100">
            <path
              d="M48 22 L62 76 L56 76 L52.5 64 L43.5 64 L40 76 L34 76 Z M45 56 L51 56 L48 44 Z"
              fill="#FFFFFF"
            />
            <path d="M58 32 L66 58 L58 58 Z" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Abkon Laundromat
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#BAE6FD",
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Clean clothes, done right.
        </div>

        {/* Services strip */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            fontSize: 22,
            color: "#E0F2FE",
          }}
        >
          <span>Wash</span>
          <span>·</span>
          <span>Iron</span>
          <span>·</span>
          <span>Wash & Iron</span>
          <span>·</span>
          <span>Dry Clean</span>
        </div>

        {/* WhatsApp tag */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 64,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            background: "#10B981",
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          Book on WhatsApp
        </div>
      </div>
    ),
    { ...size }
  );
}
