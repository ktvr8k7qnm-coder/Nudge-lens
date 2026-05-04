import { Analytics } from "@vercel/analytics/react";
import { useEffect, useMemo, useState } from "react";

/* =======================
   🧠 BIAS MODELS（不改逻辑）
======================= */

const BIAS_MODELS = [
  {
    id: "extreme_risk",
    name: "Extreme Decision Risk",
    label: "large irreversible action without enough planning",
    weight: 1.9,
    signals: ["quit job","all savings","no plan","辞职","全部积蓄"],
    interpretation: "High-risk structure.",
    nudge: "Pause and define worst-case.",
    question: "What irreversible harm could happen?"
  },
  {
    id: "present_bias",
    name: "Present Bias",
    label: "short-term reward",
    weight: 1.2,
    signals: ["now","immediately","现在","马上"],
    interpretation: "Short-term reward dominates.",
    nudge: "Translate into future cost.",
    question: "Will this still feel good in a month?"
  }
];

/* =======================
   🧠 ENGINE（简化）
======================= */

function normalize(text) {
  return text.toLowerCase();
}

function analyseDecision(text) {
  const results = BIAS_MODELS.map((m) => {
    const hits = m.signals.filter(s => normalize(text).includes(s));
    const score = hits.length * 30;
    return { ...m, score };
  }).filter(x => x.score > 0);

  const pressure = Math.min(100, results.reduce((a,b)=>a+b.score,0));
  const reflectiveIndex = 100 - pressure;

  const recommendation =
    pressure > 70 ? "Pause before acting" :
    pressure > 40 ? "Proceed carefully" :
    "Looks reasonable";

  return {
    results,
    pressure,
    reflectiveIndex,
    recommendation,
    tone: pressure > 70 ? "caution" : pressure > 40 ? "moderate" : "positive",
    gptStyleOutput: "This decision may involve behavioural pressure."
  };
}

/* =======================
   🎨 APP
======================= */

export default function App() {
  const [input, setInput] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState(null);

  /* 🔥 动态 placeholder */
  const placeholders = [
    "Describe your decision here...",
    "What are you thinking about...",
    "Tell me what's on your mind...",
    "What feels uncertain right now...",
    "Write anything — I’ll help you reflect"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setPlaceholderIndex(p => (p + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const placeholder = placeholders[placeholderIndex];

  const current = savedAnalysis || analyseDecision(input);

  const hasInput = input.trim().length > 0;

  function runAnalysis() {
    setSavedAnalysis(analyseDecision(input));
  }

  return (
    <div style={styles.page}>
      <div className="nl-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
      body, html, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;
        background: #f8f9fb;
      }

      @keyframes inputBreath {
        0% {
          box-shadow: 0 1px 6px rgba(32,33,36,.18);
          border-color: #dadce0;
          background: #fff;
        }
        50% {
          box-shadow: 0 12px 48px rgba(26,115,232,.28);
          border-color: #1a73e8;
          background: #f4f8ff;
        }
        100% {
          box-shadow: 0 1px 6px rgba(32,33,36,.18);
          border-color: #dadce0;
          background: #fff;
        }
      }

      @media (min-width: 1200px) {
        .nl-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .nl-title {
          font-size: 48px;
        }

        .nl-textarea {
          min-height: 180px;
          font-size: 18px;
          padding: 28px;
          border-radius: 32px;
        }

        .nl-button {
          padding: 14px 28px;
          font-size: 16px;
        }

        .nl-feedback h2 {
          font-size: 32px;
        }

        .nl-feedback p {
          font-size: 18px;
          line-height: 1.8;
        }

        .nl-metrics {
          display: flex;
          gap: 40px;
          font-size: 16px;
        }
      }

      `}</style>

      <h1 style={styles.title} className="nl-title">NudgeLens</h1>

      <textarea
        className="nl-textarea"
        style={{
          ...styles.searchBox,
          animation: hasInput ? "inputBreath 2.2s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
          caretColor: "#1a73e8"
        }}
        value={input}
        placeholder={placeholder}
        onFocus={(e)=>{
          e.target.style.boxShadow="0 12px 40px rgba(26,115,232,.25)";
          e.target.style.borderColor="#1a73e8";
        }}
        onBlur={(e)=>{
          e.target.style.boxShadow="0 1px 6px rgba(32,33,36,.18)";
          e.target.style.borderColor="#dadce0";
        }}
        onChange={(e)=>{
          setInput(e.target.value);
          setSavedAnalysis(null);
        }}
      />

      <button onClick={runAnalysis} style={styles.button} className="nl-button">
        Analyse
      </button>

      {input && (
        <div style={styles.feedback} className="nl-feedback">
          <h2>{current.recommendation}</h2>
          <p>{current.gptStyleOutput}</p>

          <div style={styles.metrics} className="nl-metrics">
            <div>Pressure: {current.pressure}</div>
            <div>Reflective: {current.reflectiveIndex}</div>
          </div>
        </div>
      )}

      <Analytics />
      </div>
    </div>
  );
}

/* =======================
   🎨 STYLE
======================= */

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    background: "#f8f9fb",
    paddingTop: 60,
    boxSizing: "border-box",
    fontFamily: "Arial"
  },
  title: {
    fontSize: 42,
    marginBottom: 24,
    color: "#1a73e8",
    textAlign: "center"
  },
  searchBox: {
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
    minHeight: 140,
    border: "1px solid #dadce0",
    borderRadius: 32,
    padding: 24,
    fontSize: 17,
    borderColor: "#dadce0",
    transition: "all 0.3s ease",
    display: "block"
  },
  button: {
    marginTop: 24,
    padding: "12px 28px",
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    display: "block",
    marginLeft: "auto",
    marginRight: "auto"
  },
  feedback: {
    marginTop: 40,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center"
  },
  metrics: {
    marginTop: 16,
    opacity: 0.6,
    display: "flex",
    justifyContent: "center",
    gap: 24
  }
};