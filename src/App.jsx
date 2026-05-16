import { useState } from "react";
import "./decision-ui.css";

const signalMap = {
  STOP: {
    label: "STOP AND REASSESS",
    subtitle: "Extreme Decision Risk",
    color: "#FF3B30"
  },
  CAUTION: {
    label: "CAUTION ADVISED",
    subtitle: "Moderate Uncertainty",
    color: "#FF9500"
  },
  PROCEED: {
    label: "PROCEED",
    subtitle: "Low Risk Path",
    color: "#34C759"
  }
};

export default function App() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  async function analyseDecision() {
    const input = text.trim();
    if (!input) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setAnalysis(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const safeSignal = analysis?.signal?.toUpperCase?.() || "CAUTION";
  const activeSignal = signalMap[safeSignal] || signalMap.CAUTION;

  // 🔥 variability layer (adds diversity in UI expression)
  const toneVariants = {
    STOP: ["Immediate Halt Recommended", "Critical Risk Detected", "Reconsider This Move"],
    CAUTION: ["Proceed With Awareness", "Uncertainty Present", "Careful Evaluation Needed"],
    PROCEED: ["Conditions Look Stable", "Favorable Path", "Low Immediate Risk"]
  };

  const randomTone = toneVariants[safeSignal]
    ? toneVariants[safeSignal][Math.floor(Math.random() * toneVariants[safeSignal].length)]
    : "Decision Analysis";

  return (
    <main className="decision-page">
      <div className="decision-layout">
        <h1 className="app-title">NudgeLens</h1>
        <textarea
          className="decision-input"
          placeholder="Describe your decision..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="analyse-btn" onClick={analyseDecision} disabled={loading}>
          {loading ? "Analyzing decision..." : "Analyse Decision"}
        </button>

        {error ? <p className="error-text">{error}</p> : null}

        {analysis ? (
          <section className="result-shell fade-in">
            <header className="signal-header">
              <p className="signal-value" style={{ color: activeSignal.color }}>
                {activeSignal?.label || "ANALYSIS RESULT"}
              </p>
              <p className="signal-subtitle">{randomTone || analysis?.risk?.description || "Decision Analysis"}</p>
            </header>

            <section className="metrics-grid">
              <article className="metric-card">
                <p className="metric-number">{analysis.score}</p>
                <p className="metric-label">Decision Score</p>
              </article>
              <article className="metric-card">
                <p className="metric-number">{analysis.pressure}</p>
                <p className="metric-label">Pressure Index</p>
              </article>
              <article className="metric-card">
                <p className="metric-number">{safeSignal}</p>
                <p className="metric-label">Signal</p>
              </article>
            </section>

            <section className="analysis-section">
              <article className="analysis-block">
                <h2 className="analysis-title">SUMMARY</h2>
                <p>
                  {analysis.summary || "No summary available"}
                  <br />
                  <em>
                    {analysis.score > 70
                      ? "This reflects relatively strong structural stability."
                      : analysis.score > 40
                      ? "There are moderate structural uncertainties present."
                      : "This decision shows fragile structural stability."}
                  </em>
                </p>
              </article>
              <article className="analysis-block">
                <h2 className="analysis-title">RISK</h2>
                <p>{analysis.risk?.description || analysis.risk}</p>
                {analysis.risk?.type && (
                  <p><strong>Type:</strong> {analysis.risk.type}</p>
                )}
                {analysis.score < 40 && (
                  <p><strong>Interpretation:</strong> Risk amplification likely due to compound factors.</p>
                )}
                {analysis.score >= 40 && analysis.score < 70 && (
                  <p><strong>Interpretation:</strong> Risk is situational and dependent on execution.</p>
                )}
                {analysis.score >= 70 && (
                  <p><strong>Interpretation:</strong> Risk appears contained under current assumptions.</p>
                )}
              </article>
              <article className="analysis-block">
                <h2 className="analysis-title">ADVICE</h2>
                <p>{analysis.advice || "No advice generated"}</p>
              </article>

              <article className="analysis-block">
                <h2 className="analysis-title">DECISION PATTERN</h2>
                <p>{analysis.decisionPattern?.type || "Unknown pattern"}</p>
                <p>{analysis.decisionPattern?.explanation || "No explanation available"}</p>
              </article>

              <article className="analysis-block">
                <h2 className="analysis-title">PRESSURE SOURCE</h2>
                <p>{analysis.pressureSource?.type || "Unknown source"}</p>
                <p>{analysis.pressureSource?.explanation || "No explanation available"}</p>
              </article>

              <article className="analysis-block">
                <h2 className="analysis-title">RECOMMENDATION</h2>
                <p>{analysis.recommendation?.type || "General recommendation"}</p>
                <p>{analysis.recommendation?.advice || "No advice available"}</p>
              </article>

              <article className="analysis-block">
                <h2 className="analysis-title">CONFIDENCE</h2>
                <p>
                  {analysis.confidence || "Medium"}
                  <br />
                  <em style={{ opacity: 0.6 }}>
                    {analysis.confidence === "High"
                      ? "Model confidence is supported by strong signal alignment."
                      : analysis.confidence === "Low"
                      ? "Low confidence due to weak or conflicting signals."
                      : "Moderate confidence with partial signal clarity."}
                  </em>
                </p>
              </article>

              <article className="analysis-block">
                <h2 className="analysis-title">SIMULATION</h2>

                <p><strong>Short Term:</strong></p>
                {analysis.simulation?.shortTerm?.length ? (
                  analysis.simulation.shortTerm.map((item, i) => (
                    <p key={"st-" + i}>- {item}</p>
                  ))
                ) : (
                  <p>- No short-term projection</p>
                )}
                <p style={{ opacity: 0.6 }}>
                  {analysis.pressure > 60
                    ? "Short-term volatility is likely elevated."
                    : "Short-term dynamics appear manageable."}
                </p>

                <p><strong>Mid Term:</strong></p>
                {analysis.simulation?.midTerm?.length ? (
                  analysis.simulation.midTerm.map((item, i) => (
                    <p key={"mt-" + i}>- {item}</p>
                  ))
                ) : (
                  <p>- No mid-term projection</p>
                )}
                <p style={{ opacity: 0.6 }}>
                  {analysis.score < 50
                    ? "Mid-term outcomes are highly path-dependent."
                    : "Mid-term trajectory shows conditional stability."}
                </p>

                <p><strong>Long Term:</strong></p>
                {analysis.simulation?.longTerm?.length ? (
                  analysis.simulation.longTerm.map((item, i) => (
                    <p key={"lt-" + i}>- {item}</p>
                  ))
                ) : (
                  <p>- No long-term projection</p>
                )}
                <p style={{ opacity: 0.6 }}>
                  {analysis.signal === "STOP"
                    ? "Long-term downside dominates expected distribution."
                    : "Long-term outcomes retain upside potential."}
                </p>
              </article>
            </section>
          </section>
        ) : null}
      </div>
    </main>
  );
}