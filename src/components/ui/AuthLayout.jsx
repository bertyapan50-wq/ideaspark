import React from "react";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8f7ff 0%, #f3f0ff 50%, #faf5ff 100%)" }}
    >
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,82,220,0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,82,220,0.10) 0%, transparent 70%)", transform: "translate(-30%, -30%)" }}
      />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)", transform: "translate(30%, 30%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3 mb-2">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6352dc 0%, #a855f7 50%, #60a5fa 100%)",
                boxShadow: "0 4px 20px rgba(99,82,220,0.35)",
              }}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #6352dc, #a855f7, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Conceptli
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "rgba(99,82,220,0.15)",
            boxShadow: "0 4px 32px rgba(99,82,220,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}