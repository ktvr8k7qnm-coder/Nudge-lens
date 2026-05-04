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
      <style>{`

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

      `}</style>

      <h1 style={styles.title}>NudgeLens</h1>

      <textarea
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

      <button onClick={runAnalysis} style={styles.button}>
        Analyse
      </button>

      {input && (
        <div style={styles.feedback}>
          <h2>{current.recommendation}</h2>
          <p>{current.gptStyleOutput}</p>

          <div style={styles.metrics}>
            <div>Pressure: {current.pressure}</div>
            <div>Reflective: {current.reflectiveIndex}</div>
          </div>
        </div>
      )}

      <Analytics />
    </div>
  );
}

/* =======================
   🎨 STYLE
======================= */

const styles = {
  page: {
    padding: 40,
    fontFamily: "Arial",
    background: "#fff"
  },
  title: {
    fontSize: 36,
    marginBottom: 20,
    color: "#1a73e8"
  },
  searchBox: {
    width: "100%",
    minHeight: 120,
    border: "1px solid #dadce0",
    borderRadius: 28,
    padding: 20,
    fontSize: 16,
    borderColor: "#dadce0",
    transition: "all 0.3s ease"
  },
  button: {
    marginTop: 20,
    padding: "10px 20px",
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 20
  },
  feedback: {
    marginTop: 30
  },
  metrics: {
    marginTop: 10,
    opacity: 0.6
  }
};