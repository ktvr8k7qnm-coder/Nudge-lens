import { useMemo, useState } from "react";

/* =========================================================
   NudgeLens Local Engine v3.0
   - No API
   - No OpenAI
   - No data storage
   - Detailed behavioural decision analysis
   - Scenario-aware outputs
   - Smooth kangaroo animation system
========================================================= */

const VERSION = "NudgeLens Local Engine v3.0";

const SIGNALS = [
  {
    id: "urgency",
    label: "Urgency Pressure",
    category: "time",
    weight: 18,
    words: ["today", "tomorrow", "now", "immediately", "asap", "quickly", "right now", "马上", "现在", "今天", "明天", "立刻", "赶快"],
    explanation: "The decision may be compressed by time pressure, which can reduce careful judgement.",
    action: "Pause for one short review cycle before acting."
  },
  {
    id: "uncertainty",
    label: "Information Gap",
    category: "information",
    weight: 22,
    words: ["not sure", "unsure", "unknown", "don't know", "without understanding", "no idea", "不了解", "不知道", "不确定", "没想清楚"],
    explanation: "Important information appears missing, increasing the probability of avoidable mistakes.",
    action: "List the top three unknowns and reduce at least one before acting."
  },
  {
    id: "no_plan",
    label: "Weak Planning",
    category: "planning",
    weight: 24,
    words: ["no plan", "without a plan", "without planning", "no backup", "没有计划", "没有准备", "没有后路", "没准备"],
    explanation: "The current decision structure lacks a fallback path.",
    action: "Create a minimum backup plan before committing."
  },
  {
    id: "high_stakes",
    label: "High-Stakes Move",
    category: "impact",
    weight: 28,
    words: ["quit", "resign", "move country", "career", "all money", "relationship", "break up", "辞职", "换工作", "移民", "搬去另一个国家", "分手", "全部钱", "全部积蓄"],
    explanation: "The decision may create lasting consequences and should not be treated casually.",
    action: "Find a smaller reversible first step before full commitment."
  },
  {
    id: "external_dependency",
    label: "External Dependency",
    category: "control",
    weight: 20,
    words: ["until he replies", "until she replies", "waiting for reply", "waiting for response", "until they respond", "等他回复", "等她回复", "等回复", "等消息"],
    explanation: "The decision depends on another person’s response, reducing your control.",
    action: "Define what you will do if no reply comes."
  },
  {
    id: "loss_aversion",
    label: "Loss Aversion",
    category: "emotion",
    weight: 18,
    words: ["afraid", "scared", "lose", "regret", "worried", "miss out", "fomo", "害怕", "后悔", "担心", "怕错过", "亏"],
    explanation: "The decision may be driven by avoiding discomfort rather than pursuing value.",
    action: "Separate the real downside from the emotional discomfort."
  },
  {
    id: "social_pressure",
    label: "Social Pressure",
    category: "social",
    weight: 15,
    words: ["everyone", "friends", "people say", "popular", "trend", "别人", "大家", "朋友", "都说", "流行", "热门"],
    explanation: "The decision may be influenced by social proof rather than personal fit.",
    action: "Ask whether you would still choose this privately."
  },
  {
    id: "overconfidence",
    label: "Overconfidence",
    category: "certainty",
    weight: 19,
    words: ["definitely", "sure", "guaranteed", "no risk", "cannot fail", "肯定", "一定", "绝对", "没风险", "稳赚"],
    explanation: "The decision may underestimate uncertainty or downside risk.",
    action: "Run a pre-mortem: imagine the decision failed badly and list why."
  },
  {
    id: "avoidance",
    label: "Avoidance Pattern",
    category: "emotion",
    weight: 17,
    words: ["not going to do anything", "avoid", "delay", "later", "不想做", "拖延", "以后再说", "先不管"],
    explanation: "Inaction may feel safe now but can increase future pressure.",
    action: "Choose one small action that restores control."
  }
];

function normalize(text) {
  return text.toLowerCase().replace(/[.,!?;:，。！？；：]/g, " ");
}

function detectScenario(text) {
  const t = normalize(text);

  if (["quit", "resign", "career", "job", "辞职", "工作", "职业"].some(w => t.includes(w))) return "Career / work";
  if (["move", "country", "language", "visa", "搬", "国家", "语言", "移民"].some(w => t.includes(w))) return "Life relocation";
  if (["buy", "purchase", "price", "discount", "watch", "car", "买", "价格", "折扣", "手表", "车"].some(w => t.includes(w))) return "Purchase decision";
  if (["relationship", "reply", "message", "break up", "date", "回复", "消息", "分手", "关系"].some(w => t.includes(w))) return "Relationship / social";
  if (["study", "exam", "assignment", "course", "作业", "考试", "学习", "课程"].some(w => t.includes(w))) return "Study / productivity";
  if (["invest", "stock", "crypto", "money", "投资", "股票", "基金", "钱"].some(w => t.includes(w))) return "Financial decision";

  return "General decision";
}

function analyseDecision(text) {
  const cleaned = normalize(text.trim());
  const isShort = cleaned.length < 25;

  const matched = SIGNALS.map(signal => {
    const hits = signal.words.filter(word => cleaned.includes(word.toLowerCase()));
    return {
      ...signal,
      hits,
      score: hits.length * signal.weight
    };
  }).filter(signal => signal.hits.length > 0);

  let pressure = matched.reduce((sum, signal) => sum + signal.score, 0);

  if (isShort) pressure += 12;
  if (cleaned.includes("but") || cleaned.includes("但是") || cleaned.includes("但")) pressure += 12;
  if (cleaned.includes("without") || cleaned.includes("没有")) pressure += 12;
  if (cleaned.includes("tomorrow") && cleaned.includes("without")) pressure += 20;
  if (cleaned.includes("country") && cleaned.includes("language")) pressure += 18;

  pressure = Math.max(0, Math.min(100, pressure));

  const scenario = detectScenario(text);
  const topSignal = matched.sort((a, b) => b.score - a.score)[0];

  const category =
    pressure >= 75 ? "risky" :
    pressure >= 45 ? "uncertain" :
    pressure >= 25 ? "clear" :
    "calm";

  let summary;
  let advisorView;
  let feasibility;
  let nextStep;

  if (pressure >= 75) {
    summary = "This decision is exposed to avoidable risk.";
    feasibility = "Low to medium. The decision may still be possible, but the current setup is fragile.";
    advisorView =
      "The main concern is not whether the goal is attractive. The concern is that the current conditions reduce control: limited preparation, limited information, or excessive urgency.";
    nextStep = topSignal?.action || "Pause and reduce the most obvious risk before acting.";
  } else if (pressure >= 45) {
    summary = "This decision needs more structure before action.";
    feasibility = "Medium. The decision may be reasonable, but it needs clearer boundaries.";
    advisorView =
      "There are warning signs, but they do not necessarily mean the decision is wrong. The better move is to make the uncertainty visible and test a smaller version first.";
    nextStep = topSignal?.action || "Compare your current plan with one safer alternative.";
  } else if (pressure >= 25) {
    summary = "This decision looks manageable, but still worth reviewing.";
    feasibility = "Medium to high. No severe risk pattern is visible, but a short review would improve confidence.";
    advisorView =
      "The decision appears reasonably controlled. Still, there may be practical details worth checking before you commit.";
    nextStep = "Identify one small action that confirms whether the decision still makes sense.";
  } else {
    summary = "Low pressure detected.";
    feasibility = "High, based on the limited information provided.";
    advisorView =
      "No strong behavioural pressure is visible from the current sentence. A more detailed sentence would allow a sharper analysis.";
    nextStep = "Add context: what you want, what worries you, and what happens if you wait.";
  }

  return {
    summary,
    advisorView,
    feasibility,
    nextStep,
    pressure,
    category,
    scenario,
    topSignal: topSignal?.label || "None",
    matched
  };
}

const MOTIONS = {
  risky: ["shake", "pulse", "bounce"],
  uncertain: ["float", "sway", "bounce"],
  clear: ["bounce", "float", "pulse"],
  calm: ["breath", "fade", "float"]
};

function pickMotion(category) {
  const list = MOTIONS[category] || MOTIONS.calm;
  return list[Math.floor(Math.random() * list.length)];
}

function Human() {
  return (
    <div style={styles.human}>
      <div style={styles.head}></div>
      <div style={styles.body}></div>
    </div>
  );
}

function Kangaroo({ motion }) {
  return (
    <div className={motion} style={styles.kangaroo}>
      🦘
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [motion, setMotion] = useState("float");

  const liveHint = useMemo(() => {
    if (!input.trim()) return "Try writing one complete sentence.";
    if (input.trim().length < 25) return "More context will make the analysis sharper.";
    if (input.includes("but") || input.includes("但是")) return "Good: you included a tension point.";
    return "Good. Add what makes the decision difficult if you want a sharper result.";
  }, [input]);

  function run() {
    const analysis = analyseDecision(input);
    setResult(analysis);
    setMotion(pickMotion(analysis.category));
  }

  function clearAll() {
    setInput("");
    setResult(null);
    setMotion("float");
  }

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <div style={styles.brand}>NudgeLens · Local Advisor</div>

        <h1 style={styles.title}>Decision Reflection Assistant</h1>

        <p style={styles.subtitle}>
          Write one full sentence. NudgeLens identifies behavioural pressure, feasibility, and a practical next step.
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Example: I want to quit my job, but I do not have a clear plan yet."
          style={styles.input}
        />

        <p style={styles.hint}>{liveHint}</p>

        <div style={styles.buttons}>
          <button onClick={run} style={styles.primaryButton}>Analyse decision</button>
          <button onClick={clearAll} style={styles.secondaryButton}>Clear</button>
        </div>

        <p style={styles.privacy}>
          No login. No API. No data stored. This version runs locally in the browser.
        </p>

        {result && (
          <section style={styles.resultCard}>
            <div style={styles.cardTop}>
              <span style={styles.smallLabel}>Advisor view</span>
              <span style={styles.badge}>{result.scenario}</span>
            </div>

            <h2 style={styles.resultTitle}>{result.summary}</h2>

            <p style={styles.paragraph}>{result.advisorView}</p>

            <div style={styles.metrics}>
              <div style={styles.metricBox}>
                Pressure index
                <br />
                <strong>{result.pressure}</strong>
              </div>
              <div style={styles.metricBox}>
                Decision state
                <br />
                <strong>{result.category}</strong>
              </div>
              <div style={styles.metricBox}>
                Top signal
                <br />
                <strong>{result.topSignal}</strong>
              </div>
            </div>

            <div style={styles.nextBox}>
              <strong>Feasibility</strong>
              <p>{result.feasibility}</p>
            </div>

            <div style={styles.nextBox}>
              <strong>Next practical step</strong>
              <p>{result.nextStep}</p>
            </div>

            {result.matched.length > 0 && (
              <div style={styles.signalList}>
                <strong>Detected signals</strong>
                {result.matched.map((signal) => (
                  <div key={signal.id} style={styles.signalItem}>
                    <span>{signal.label}</span>
                    <small>{signal.explanation}</small>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.scene}>
              <Human />
              <Kangaroo motion={motion} />
            </div>
          </section>
        )}
      </main>

      <style>{`
        html, body, #root {
          margin: 0;
          min-height: 100%;
          background: #ffffff;
        }

        .float { animation: float 2s ease-in-out infinite; }
        .bounce { animation: bounce 1.7s ease-in-out infinite; }
        .shake { animation: shake .45s ease-in-out infinite; }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        .sway { animation: sway 2s ease-in-out infinite; }
        .breath { animation: breath 2.4s ease-in-out infinite; }
        .fade { animation: fade 2s ease-in-out infinite; }

        @keyframes float { 50% { transform: translateY(-8px); } }
        @keyframes bounce { 50% { transform: translateY(-14px); } }
        @keyframes shake { 50% { transform: translateX(-5px); } }
        @keyframes pulse { 50% { transform: scale(1.08); } }
        @keyframes sway { 50% { transform: rotate(5deg); } }
        @keyframes breath { 50% { transform: scale(1.03); } }
        @keyframes fade { 50% { opacity: .55; } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#111827"
  },
  container: {
    width: "min(920px, calc(100vw - 40px))",
    margin: "0 auto",
    padding: "52px 0",
    textAlign: "center"
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: "#5b6472",
    marginBottom: 14
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 56px)",
    color: "#2f6fdf",
    letterSpacing: "-1.6px"
  },
  subtitle: {
    margin: "14px auto 28px",
    maxWidth: 720,
    color: "#5b6472",
    lineHeight: 1.55
  },
  input: {
    width: "min(760px, 100%)",
    minHeight: 128,
    borderRadius: 26,
    border: "1px solid #d9dde5",
    boxShadow: "0 18px 40px rgba(15, 23, 42, .10)",
    padding: 24,
    fontSize: 16,
    outline: "none",
    resize: "vertical"
  },
  hint: {
    color: "#8a93a3",
    fontSize: 13,
    marginTop: 12
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: 14,
    marginTop: 24
  },
  primaryButton: {
    border: 0,
    borderRadius: 999,
    background: "#2f6fdf",
    color: "#fff",
    padding: "14px 24px",
    fontWeight: 700,
    cursor: "pointer"
  },
  secondaryButton: {
    border: "1px solid #d9dde5",
    borderRadius: 999,
    background: "#fff",
    color: "#2f6fdf",
    padding: "14px 24px",
    fontWeight: 700,
    cursor: "pointer"
  },
  privacy: {
    marginTop: 16,
    color: "#8a93a3",
    fontSize: 13
  },
  resultCard: {
    margin: "38px auto 0",
    maxWidth: 820,
    border: "1px solid #9fd0ac",
    borderRadius: 28,
    background: "linear-gradient(180deg, #f4fff7, #ffffff)",
    padding: 28,
    textAlign: "left",
    boxShadow: "0 20px 50px rgba(15, 23, 42, .08)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  smallLabel: {
    color: "#5b6472",
    fontSize: 13,
    fontWeight: 700
  },
  badge: {
    background: "#ffffff",
    border: "1px solid #d9dde5",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700
  },
  resultTitle: {
    textAlign: "center",
    color: "#2f7d3e",
    fontSize: 32,
    margin: "12px 0"
  },
  paragraph: {
    color: "#3f4754",
    lineHeight: 1.65,
    textAlign: "center"
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
    marginTop: 22
  },
  metricBox: {
    border: "1px solid #b8d8bf",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    textAlign: "center",
    color: "#5b6472"
  },
  nextBox: {
    marginTop: 18,
    borderTop: "1px solid #e7ebef",
    paddingTop: 18,
    textAlign: "center"
  },
  signalList: {
    marginTop: 18,
    display: "grid",
    gap: 10
  },
  signalItem: {
    background: "#ffffff",
    border: "1px solid #e7ebef",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 6
  },
  scene: {
    display: "flex",
    justifyContent: "center",
    alignItems: "end",
    gap: 36,
    marginTop: 28
  },
  human: {
    width: 70,
    height: 90,
    display: "grid",
    justifyItems: "center"
  },
  head: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#0B1FFF"
  },
  body: {
    width: 26,
    height: 46,
    borderRadius: 12,
    background: "#0B1FFF",
    marginTop: 6
  },
  kangaroo: {
    fontSize: 58,
    filter: "saturate(1.4)"
  }
};