import { ImageResponse } from "next/og";

export const alt = "Eternal Fitness — Level 4 Personal Training in Worthing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#282B38",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Rose accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#C1839F",
          }}
        />

        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            border: "1px solid rgba(193,131,159,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "1px solid rgba(193,131,159,0.1)",
          }}
        />

        {/* Top: brand name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#C1839F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            4
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Eternal Fitness
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 2 }}>
              Worthing, West Sussex
            </div>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Personal Training for Health Conditions
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              maxWidth: 700,
            }}
          >
            Exercise for Health. Not Aesthetics.
          </div>
        </div>

        {/* Bottom: credentials row */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            "Level 4 PT",
            "Exercise Referral Specialist",
            "Cancer Rehabilitation",
            "Visual Impairment",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(193,131,159,0.15)",
                border: "1px solid rgba(193,131,159,0.3)",
                borderRadius: 999,
                padding: "8px 18px",
                color: "#C1839F",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
