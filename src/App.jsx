import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyse() {
    if (!text) return;

    setLoading(true);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input: text })
      });

      const data = await res.json();
      setResult(data.result || "No result");
    } catch (e) {
      setResult("Error: " + e.message);
    }

    setLoading(false);
  }

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
        onClick={analyse}
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
        {loading ? "Analysing..." : "Analyse"}
      </button>
      {result && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            borderRadius: 12,
            background: "#f5f7fa",
            textAlign: "left",
            whiteSpace: "pre-wrap"
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}