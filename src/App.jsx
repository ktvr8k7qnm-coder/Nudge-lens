import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");

  return (
    <div
      style={{
        fontFamily: "Arial",
        padding: 40,
        textAlign: "center",
        maxWidth: 600,
        margin: "auto"
      }}
    >
      <h1>Nudgelens</h1>

      <p style={{ opacity: 0.6 }}>
        Personal project — decision clarity tool
      </p>

      <textarea
        placeholder="Describe your decision..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          height: 120,
          borderRadius: 12,
          padding: 15,
          marginTop: 20,
          border: "1px solid #ddd"
        }}
      />

      <br />

      <button
        style={{
          marginTop: 20,
          padding: "10px 20px",
          borderRadius: 999,
          border: "none",
          background: "#1a73e8",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Analyse
      </button>
    </div>
  );
}