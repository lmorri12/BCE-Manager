"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#fafafa",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            borderRadius: "0.5rem",
            border: "1px solid #e5e5e5",
            background: "#ffffff",
            padding: "2rem",
            textAlign: "center",
          }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Application error</h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
              A critical error occurred. Please try reloading the page.
            </p>
            {error.message && (
              <p style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                fontFamily: "ui-monospace, monospace",
                background: "#f5f5f5",
                borderRadius: "0.25rem",
                padding: "0.5rem 0.75rem",
                marginTop: "1rem",
                wordBreak: "break-all",
              }}>
                {error.message}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                marginTop: "1rem",
                height: "2.5rem",
                padding: "0 1rem",
                borderRadius: "0.375rem",
                background: "#171717",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ fontSize: "0.625rem", color: "#9ca3af", fontFamily: "ui-monospace, monospace", marginTop: "0.75rem" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
