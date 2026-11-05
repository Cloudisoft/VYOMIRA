"use client";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#080D20", color: "#E9E3F5", fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "grid", placeItems: "center", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <p style={{ letterSpacing: "0.3em", color: "#D8B477", fontSize: 12 }}>VYOMIRA</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 40 }}>A cloud passed over.</h1>
          <p style={{ color: "#9BA3BC" }}>Something went wrong loading the page. Nothing you entered has been lost.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: 0, background: "#D8B477", color: "#1a1407", fontWeight: 600, cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
