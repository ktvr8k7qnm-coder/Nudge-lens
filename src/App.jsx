<<<<<<< HEAD
import { Analytics } from "@vercel/analytics/react";
=======

>>>>>>> 8ea08bd (upgrade detection engine v7)
import { useEffect, useMemo, useState } from "react";

/*
  NudgeLens v7
  Local behavioural decision reflection tool.
  No backend. No API. No external UI library.

  v7 calibration notes:
  - Stronger extreme-risk floor: irreversible life/career/financial decisions cannot be scored as zero.
  - Better handling of "without planning / without telling anyone / all savings" cases.
  - Protective reasoning can lower pressure, but it cannot fully cancel extreme-risk signals.

  Key upgrades:
  - Recognises extreme life-risk decisions, not just buying/investing bias.
  - Supports English and Chinese inputs.
  - Uses weighted patterns + protective reasoning signals.
  - Main screen gives a clear recommendation.
  - Detailed analysis is folded below.
*/

const MODELS = [
  {
    id: "extreme_risk",
    name: "Extreme Decision Risk",
    label: "large irreversible action without planning",
    weight: 1.8,
    patterns: [
      ["sold everything", 8],
      ["sold all my belongings", 9],
      ["sold all my possessions", 9],
      ["quit my job", 8],
      ["resigned from my job", 8],
      ["left my job", 7],
      ["without another job", 8],
      ["without a backup plan", 9],
      ["without planning", 8],
      ["without a plan", 8],
      ["without any plan", 8],
      ["no plan", 8],
      ["without savings", 8],
      ["no savings", 8],
      ["without knowing the language", 7],
      ["without telling my family", 7],
      ["without telling anyone", 7],
      ["moved to another country", 8],
      ["move to another country", 8],
      ["all my money", 8],
      ["all my savings", 9],
      ["spent all my savings", 9],
      ["invested everything", 9],
      ["trusted a stranger", 8],
      ["ignored all warnings", 8],
      ["refused to listen", 7],
      ["huge decision within minutes", 8],
      ["just to prove a point", 7],
      ["没有计划", 8],
      ["没有后路", 9],
      ["辞职", 7],
      ["卖掉所有", 9],
      ["全部积蓄", 9],
      ["所有存款", 9],
      ["没有告诉任何人", 7],
      ["搬去另一个国家", 8],
      ["没有存款", 8],
      ["没有语言", 7],
      ["没有准备", 8],
      ["相信陌生人", 8]
    ],
    interpretation:
      "The decision appears large, hard to reverse, and weakly planned. This is a high-risk structure even if the motivation feels strong.",
    nudge:
      "Pause immediately. Define the worst-case outcome, create a backup plan, and consult at least one independent person before acting.",
    question:
      "What irreversible harm could happen if this decision goes wrong?"
  },
  {
    id: "evidence_neglect",
    name: "Evidence Neglect",
    label: "intuition overriding evidence",
    weight: 1.45,
    patterns: [
      ["trust my intuition", 6],
      ["trust intuition", 6],
      ["trust my gut", 6],
      ["gut feeling", 5],
      ["trust my judgment", 5],
      ["trust my experience", 5],
      ["more than the data", 7],
      ["ignore the data", 7],
      ["data does not matter", 7],
      ["without checking", 6],
      ["without evidence", 6],
      ["without strong evidence", 7],
      ["without deep analysis", 6],
      ["haven't checked", 5],
      ["haven't compared", 5],
      ["haven't calculated", 5],
      ["data is incomplete", 6],
      ["numbers are uncertain", 6],
      ["feels right", 5],
      ["spreadsheet", 3],
      ["凭感觉", 6],
      ["相信直觉", 6],
      ["直觉", 5],
      ["不看数据", 7],
      ["数据不重要", 7],
      ["没检查", 5],
      ["没计算", 5],
      ["没对比", 5]
    ],
    interpretation:
      "The decision may rely on intuition or emotion while discounting available evidence.",
    nudge:
      "Write down three measurable facts that support this decision before acting.",
    question:
      "What specific evidence supports this choice?"
  },
  {
    id: "extreme_risk",
    name: "Extreme Decision Risk",
    label: "large irreversible action without enough planning",
    weight: 1.9,
    signals: [
      "sold everything", "sold all my belongings", "sold all my possessions",
      "quit my job", "resigned from my job", "left my job",
      "without another job", "without a backup plan", "without planning",
      "without any plan", "without a plan", "no plan", "without telling anyone",
      "moved to another country", "move to another country", "all my savings",
      "all my money", "spent all my savings", "invested everything",
      "trusted a stranger", "ignored all warnings", "refused to listen",
      "huge decision within minutes", "just to prove a point",
      "没有计划", "没有后路", "辞职", "卖掉所有", "全部积蓄",
      "所有存款", "没有告诉任何人", "搬去另一个国家", "相信陌生人"
    ],
    interpretation:
      "The decision appears large, hard to reverse, and weakly planned. This is a high-risk structure even if the motivation feels strong.",
    nudge:
      "Pause immediately. Define the worst-case outcome, create a backup plan, and consult at least one independent person before acting.",
    question:
      "What irreversible harm could happen if this decision goes wrong?"
  },
  {
    id: "loss_aversion",
    name: "Loss Aversion",
    label: "regret or fear of missing out",
    weight: 1.3,
    patterns: [
      ["regret forever", 7],
      ["regret", 4],
      ["miss out", 6],
      ["fomo", 7],
      ["last chance", 6],
      ["left behind", 6],
      ["opportunity disappears", 6],
      ["before it is gone", 6],
      ["recover previous losses", 7],
      ["too good to miss", 6],
      ["后悔", 4],
      ["错过", 4],
      ["怕错过", 6],
      ["最后机会", 6],
      ["机会没了", 6],
      ["回本", 7]
    ],
    interpretation:
      "The decision may be driven by regret avoidance rather than objective value.",
    nudge:
      "Delay the decision for 24 hours and reassess after the emotional pressure drops.",
    question:
      "Am I choosing value, or escaping the pain of missing out?"
  },
  {
    id: "anchoring",
    name: "Anchoring Bias",
    label: "discount or reference-price framing",
    weight: 1.15,
    patterns: [
      ["discount", 4],
      ["sale", 4],
      ["original price", 6],
      ["original", 3],
      ["price", 2],
      ["cheap", 3],
      ["deal", 4],
      ["bargain", 4],
      ["50%", 6],
      ["40%", 6],
      ["30%", 6],
      ["marked down", 6],
      ["lower than usual", 6],
      ["stupid not to buy", 7],
      ["折扣", 4],
      ["打折", 4],
      ["原价", 6],
      ["价格", 2],
      ["便宜", 3],
      ["优惠", 4],
      ["划算", 4],
      ["降价", 4]
    ],
    interpretation:
      "The decision may be overly influenced by a discount or reference price.",
    nudge:
      "Ignore the original price and judge only the final price, usefulness, and opportunity cost.",
    question:
      "Would I still want this if the discount label disappeared?"
  },
  {
    id: "social_proof",
    name: "Social Proof",
    label: "social validation pressure",
    weight: 1.1,
    patterns: [
      ["everyone else", 6],
      ["everyone", 4],
      ["friends", 4],
      ["popular", 4],
      ["reviews", 3],
      ["people are talking", 6],
      ["many people", 4],
      ["recommended", 4],
      ["successful people", 6],
      ["only one without it", 7],
      ["别人", 4],
      ["大家", 4],
      ["朋友", 4],
      ["流行", 4],
      ["评价", 3],
      ["都说", 4],
      ["很多人", 4],
      ["推荐", 4],
      ["热门", 4],
      ["网红", 6]
    ],
    interpretation:
      "The decision may be using popularity as a substitute for personal fit.",
    nudge:
      "Remove the audience and ask whether you would still choose it privately.",
    question:
      "Is this my own preference, or borrowed preference?"
  },
  {
    id: "present_bias",
    name: "Present Bias",
    label: "immediate reward over future cost",
    weight: 1.12,
    patterns: [
      ["right now", 6],
      ["now", 3],
      ["today", 3],
      ["immediately", 6],
      ["act quickly", 6],
      ["reward myself", 6],
      ["feel better", 5],
      ["feel good", 5],
      ["want it now", 6],
      ["buy it now", 6],
      ["rare opportunity", 5],
      ["现在", 3],
      ["马上", 5],
      ["今天", 3],
      ["立刻", 6],
      ["奖励自己", 6],
      ["爽", 5],
      ["开心", 3],
      ["想要", 3]
    ],
    interpretation:
      "Immediate satisfaction may be more visible than future cost.",
    nudge:
      "Translate this choice into future cost: what will it reduce next month?",
    question:
      "Will this still feel like a good decision one month from now?"
  },
  {
    id: "sunk_cost",
    name: "Sunk Cost Fallacy",
    label: "past investment pressure",
    weight: 1.2,
    patterns: [
      ["already spent", 7],
      ["already invested", 7],
      ["spent so much", 7],
      ["spent hours", 6],
      ["would waste", 6],
      ["wasted", 4],
      ["continue", 3],
      ["committed", 5],
      ["stopping now", 6],
      ["researching this", 5],
      ["so much time", 6],
      ["already told people", 6],
      ["已经", 3],
      ["花了", 4],
      ["浪费", 4],
      ["继续", 3],
      ["研究了", 4],
      ["白费", 6],
      ["投入", 4],
      ["舍不得", 6]
    ],
    interpretation:
      "Past effort may be pulling the user into a decision that no longer makes sense.",
    nudge:
      "Ignore past cost. Ask whether this is still the best option from today onward.",
    question:
      "If I had not invested anything yet, would I still choose this?"
  },
  {
    id: "overconfidence",
    name: "Overconfidence",
    label: "underestimating uncertainty",
    weight: 1.28,
    patterns: [
      ["absolutely sure", 7],
      ["sure", 3],
      ["certain", 4],
      ["definitely", 6],
      ["guaranteed", 7],
      ["cannot fail", 7],
      ["no risk", 7],
      ["will definitely", 7],
      ["easy money", 7],
      ["predict the market", 7],
      ["better than most", 7],
      ["make me rich quickly", 7],
      ["will earn money quickly", 7],
      ["稳赚", 7],
      ["肯定", 4],
      ["一定", 4],
      ["不会错", 6],
      ["很简单", 4],
      ["确定", 4],
      ["没风险", 7],
      ["稳赢", 7],
      ["绝对", 6]
    ],
    interpretation:
      "The decision may underestimate uncertainty, downside risk, or the chance of being wrong.",
    nudge:
      "Run a pre-mortem: imagine this failed badly. What are the three most likely reasons?",
    question:
      "What evidence would prove my current belief wrong?"
  },
  {
    id: "planning_fallacy",
    name: "Planning Fallacy",
    label: "underestimating time or difficulty",
    weight: 1.12,
    patterns: [
      ["start studying tomorrow", 7],
      ["finish everything quickly", 7],
      ["not take long", 6],
      ["easy to finish", 6],
      ["enough time", 6],
      ["last minute", 7],
      ["later", 3],
      ["tomorrow", 3],
      ["quickly", 3],
      ["quick", 3],
      ["simple", 3],
      ["not hard", 4],
      ["明天", 3],
      ["以后", 3],
      ["来得及", 6],
      ["很快", 4],
      ["不难", 4],
      ["时间够", 6],
      ["简单", 3],
      ["晚点", 3]
    ],
    interpretation:
      "The plan may look easier in imagination than it will feel in execution.",
    nudge:
      "Break the plan into the smallest next action and multiply estimated time by 1.5.",
    question:
      "Did similar past tasks finish faster or slower than expected?"
  }
];

const PROTECTIVE_PATTERNS = [
  ["compared alternatives", 7],
  ["compared", 4],
  ["compare", 4],
  ["alternatives", 4],
  ["checked", 4],
  ["reviewed the data", 7],
  ["reviewed", 4],
  ["budget", 4],
  ["fits my budget", 7],
  ["financial goals", 7],
  ["savings goal", 7],
  ["long-term", 6],
  ["long term", 6],
  ["waited", 6],
  ["delayed", 6],
  ["confirmed", 4],
  ["actual needs", 6],
  ["real problem", 6],
  ["more information", 4],
  ["maintenance costs", 6],
  ["backup plan", 8],
  ["another job lined up", 8],
  ["emergency fund", 8],
  ["discussed with family", 6],
  ["asked for advice", 6],
  ["decided not to buy", 7],
  ["evidence", 4],
  ["calculated", 6],
  ["比较", 4],
  ["替代", 4],
  ["检查", 4],
  ["预算", 4],
  ["长期", 6],
  ["等待", 6],
  ["延迟", 6],
  ["确认", 4],
  ["真实需要", 6],
  ["数据", 4],
  ["证据", 4],
  ["计算", 6],
  ["备用计划", 8],
  ["后备计划", 8]
];

const NEGATION_PATTERNS = [
  "not sure",
  "not certain",
  "not guaranteed",
  "not confident",
  "cannot be sure",
  "uncertain",
  "不确定",
  "不一定",
  "没有把握"
];

function normalise(text) {
  return text
    .toLowerCase()
    .replaceAll(",", " ")
    .replaceAll(".", " ")
    .replaceAll("?", " ")
    .replaceAll("!", " ")
    .replaceAll(";", " ")
    .replaceAll(":", " ")
    .replaceAll("，", " ")
    .replaceAll("。", " ")
    .replaceAll("？", " ")
    .replaceAll("！", " ");
}

function findWeightedHits(text, patterns) {
  const lower = normalise(text);
  return patterns
    .filter(([pattern]) => lower.includes(pattern.toLowerCase()))
    .map(([text, weight]) => ({ text, weight }));
}

function wordCount(text) {
  const words = normalise(text).split(" ").filter(Boolean).length;
  const chineseChars = [...text].filter((char) => char >= "一" && char <= "龥").length;
  return Math.max(1, words + Math.ceil(chineseChars / 2));
}

function hasNegation(text) {
  const lower = normalise(text);
  return NEGATION_PATTERNS.some((pattern) => lower.includes(pattern));
}

function detectDecisionType(text) {
<<<<<<< HEAD
  const lower = normalizeText(text);

  if (["invest", "stock", "crypto", "fund", "股票", "投资", "基金", "市场"].some((x) => lower.includes(x))) {
    return "Investment / financial decision";
  }

  if (["buy", "purchase", "watch", "phone", "car", "买", "购买", "手表", "手机", "车"].some((x) => lower.includes(x))) {
    return "Consumer decision";
  }

  if (["study", "assignment", "exam", "复习", "作业", "考试", "学习"].some((x) => lower.includes(x))) {
    return "Study / productivity decision";
  }

  if (["move", "country", "belongings", "savings", "family", "relationship", "quit", "job", "resign", "搬", "国家", "存款", "家人", "辞职"].some((x) => lower.includes(x))) {
    return "Life / career decision";
  }

=======
  const lower = normalise(text);
  if (["intuition", "gut feeling", "instinct", "data", "evidence", "spreadsheet", "numbers", "judgment", "直觉", "凭感觉", "数据", "证据"].some((x) => lower.includes(x))) return "Judgement / evidence-based decision";
  if (["job", "career", "quit", "resign", "internship", "major", "application", "工作", "职业", "实习", "专业", "申请", "辞职"].some((x) => lower.includes(x))) return "Career / education decision";
  if (["invest", "stock", "crypto", "fund", "market", "portfolio", "return", "losses", "股票", "投资", "基金", "市场", "组合"].some((x) => lower.includes(x))) return "Investment / financial decision";
  if (["move", "country", "belongings", "savings", "family", "relationship", "搬", "国家", "存款", "家人"].some((x) => lower.includes(x))) return "Life decision";
  if (["buy", "purchase", "product", "watch", "phone", "car", "laptop", "item", "deal", "买", "购买", "产品", "手表", "手机", "车"].some((x) => lower.includes(x))) return "Consumer decision";
  if (["study", "assignment", "exam", "course", "homework", "task", "studying", "复习", "作业", "考试", "学习", "任务"].some((x) => lower.includes(x))) return "Study / productivity decision";
>>>>>>> 8ea08bd (upgrade detection engine v7)
  return "General decision";
}

function scoreModel(model, text, words) {
  const hits = findWeightedHits(text, model.patterns);
  const weightedSignal = hits.reduce((sum, hit) => sum + hit.weight, 0);
  const diversityBonus = hits.length >= 2 ? 12 : 0;
  const longPhraseBonus = hits.some((hit) => hit.text.includes(" ") || hit.text.length >= 6) ? 10 : 0;
  let raw = weightedSignal * 10 + diversityBonus + longPhraseBonus;

  if (model.id === "overconfidence" && hasNegation(text)) raw *= 0.45;

  const score = Math.min(98, Math.round((raw * model.weight) / Math.max(1, words / 75)));
  const level = score >= 72 ? "High" : score >= 38 ? "Medium" : "Low";

  return { ...model, evidence: hits.map((hit) => hit.text), score, level };
}

function analyseDecision(text) {
  const words = wordCount(text);
  const protectiveHits = findWeightedHits(text, PROTECTIVE_PATTERNS);
  const protectiveScore = protectiveHits.reduce((sum, hit) => sum + hit.weight, 0);

  const biasResults = MODELS
    .map((model) => scoreModel(model, text, words))
    .filter((item) => item.score >= 14 || item.evidence.length > 0)
    .sort((a, b) => b.score - a.score);

  let pressure = biasResults.reduce((sum, item) => sum + item.score, 0) - protectiveScore * 7;

  const extremeRisk = biasResults.find((item) => item.id === "extreme_risk");
  const hasExtremeRisk = extremeRisk && extremeRisk.score >= 38;

  if (protectiveHits.length >= 2 && pressure < 65 && !hasExtremeRisk) pressure -= 10;

  // Calibration floor: high-impact, low-planning decisions should never appear as "pressure 0".
  if (hasExtremeRisk) {
    pressure = Math.max(pressure, extremeRisk.score >= 72 ? 86 : 64);
  }

  if (!text.trim()) pressure = 0;
  pressure = Math.max(0, Math.min(100, Math.round(pressure)));

  const reflectiveIndex = Math.max(10, Math.min(100, 100 - pressure + protectiveScore));

<<<<<<< HEAD
  const topBias = results[0];
  const extremeRisk = results.find((item) => item.id === "extreme_risk");
  const highRiskBiasIds = ["extreme_risk", "overconfidence", "loss_aversion", "sunk_cost", "present_bias"];
  const hasHighRiskBias = results.some(
    (item) => highRiskBiasIds.includes(item.id) && item.score >= 38
  );
  const hasMultipleSignals = results.length >= 2;
  const hasStrongSignal = Boolean(topBias && topBias.score >= 64);
  const hasAnyMeaningfulSignal = Boolean(topBias && topBias.score >= 26);
  const isEmptyInput = text.trim().length === 0;

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const strongStop = [
    "Do not proceed yet",
    "Pause before committing",
    "Hold this decision",
    "Stop and reassess",
    "Delay this action"
  ];

  const moderate = [
    "Proceed carefully",
    "Slow down and evaluate",
    "Consider alternatives first",
    "Review before deciding",
    "Take a step back"
  ];

  const positive = [
    "Low pressure detected",
    "Reasonable to proceed",
    "Decision looks stable",
    "No strong red flags",
    "Safe to continue"
  ];

  let recommendation = "Add more context first";
  let tone = "moderate";

  if (isEmptyInput) {
    recommendation = "Add more context first";
  } else if (extremeRisk && extremeRisk.score >= 38) {
    recommendation = pick(strongStop);
    tone = "caution";
  } else if (pressure >= 75 || hasStrongSignal) {
    recommendation = pick(strongStop);
    tone = "caution";
  } else if (pressure >= 40 || hasHighRiskBias || hasMultipleSignals) {
    recommendation = pick(moderate);
    tone = "moderate";
  } else {
    recommendation = pick(positive);
    tone = "positive";
  }

  const reasonVariants = [
    "This decision shows signs of cognitive pressure rather than pure evaluation.",
    "Your wording suggests behavioural influence rather than neutral judgment.",
    "There are subtle signals indicating bias may be affecting this decision.",
    "The framing of this choice reveals potential psychological pressure.",
    "Some elements of this decision appear emotionally or socially driven."
  ];

  const riskVariants = [
    "The downside risk may not be fully considered.",
    "There may be hidden costs or irreversible consequences.",
    "Execution risk appears higher than expected.",
    "Future regret probability is non-trivial.",
    "This may reduce optionality going forward."
  ];

  const safeVariants = [
    "No strong distortions are visible in the current wording.",
    "The structure appears relatively balanced.",
    "This looks like a considered decision.",
    "There are no dominant behavioural signals detected.",
    "The decision framing appears stable."
  ];

  const universalAdvice = [
    "Clarify your objective before deciding.",
    "List 2–3 alternatives before committing.",
    "Check if this aligns with your long-term priorities.",
    "Consider what future-you would think about this.",
    "Pause and evaluate the trade-offs explicitly."
  ];

  const contextualPrompts = [
    "What are you optimizing for: speed, safety, or upside?",
    "What happens if you do nothing instead?",
    "What assumptions are you making here?",
    "What would a rational outsider advise?",
    "What is the hidden downside?"
  ];

  const expansionLines = [
    "This situation likely contains more variables than currently described.",
    "The decision context may be incomplete or simplified.",
    "Additional factors could materially change the outcome.",
    "The current framing may omit important constraints.",
    "There may be unseen second-order effects."
  ];

  const mainReason = isEmptyInput
    ? pick(universalAdvice)
    : topBias
    ? `${pick(reasonVariants)} The strongest signal is ${topBias.name}.`
    : `${pick(safeVariants)} ${pick(expansionLines)}`;

  const secondaryReason = isEmptyInput
    ? pick(contextualPrompts)
    : pressure >= 75
    ? `${pick(riskVariants)} ${pick(contextualPrompts)}`
    : pressure >= 40
    ? `${pick(reasonVariants)} ${pick(universalAdvice)}`
    : `${pick(safeVariants)} ${pick(contextualPrompts)}`;

  const synthesisVariants = [
    "Overall, this decision should be approached with caution. The signals suggest that your current framing may be influenced by behavioural pressure rather than purely objective evaluation.",
    "From a structural perspective, this decision contains elements that could lead to suboptimal outcomes if executed without further reflection.",
    "Taken together, the signals indicate that this is not purely a neutral decision — there are underlying pressures shaping the choice.",
    "At a higher level, this decision appears to be influenced by psychological or contextual factors that may not be fully visible.",
    "In summary, this decision is not necessarily wrong, but it is not yet sufficiently robust given the current framing."
  ];

  const actionVariants = [
    "Before proceeding, it would be useful to explicitly define alternatives and compare them under the same criteria.",
    "A practical next step would be to slow down and stress-test the downside scenario.",
    "You may want to pause and evaluate whether this still makes sense under different assumptions.",
    "Consider stepping back and reframing the decision as if advising someone else.",
    "It may help to delay action slightly and revisit this with a clearer objective."
  ];

  const gptStyleOutput = isEmptyInput
    ? "Provide more context so the decision can be evaluated meaningfully."
    : `${pick(synthesisVariants)} ${mainReason} ${secondaryReason} ${pick(actionVariants)}`;
=======
  let recommendation = "Reasonable to proceed";
  let tone = "positive";
  if (pressure >= 72) {
    recommendation = "Do not decide yet";
    tone = "caution";
  } else if (pressure >= 38) {
    recommendation = "Delay and compare alternatives";
    tone = "moderate";
  }

  const topBias = biasResults[0];
  const mainReason = topBias
    ? `The strongest signal is ${topBias.name}. This suggests the decision may be influenced by ${topBias.label} rather than only objective value.`
    : "No dominant behavioural bias was detected. The decision language appears relatively balanced.";

  const secondaryReason = pressure >= 72
    ? "Decision pressure is high. Acting immediately may increase regret risk."
    : pressure >= 38
    ? "Some pressure signals are present. A short delay and comparison with alternatives may improve clarity."
    : protectiveHits.length > 0
    ? "Protective reasoning signals were detected, such as comparison, delay, budgeting, or evidence checking."
    : "Decision pressure is low. The current framing does not show strong urgency, fear, or social-pressure signals.";
>>>>>>> 8ea08bd (upgrade detection engine v7)

  return {
    decisionType: detectDecisionType(text),
    biasResults,
    protectiveHits: protectiveHits.map((hit) => hit.text),
    pressure,
    reflectiveIndex,
    recommendation,
    tone,
    mainReason,
    secondaryReason,
    gptStyleOutput,
    generatedAt: new Date().toLocaleString()
  };
}

export default function App() {
  const [input, setInput] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [animatedPressure, setAnimatedPressure] = useState(0);
  const [animatedReflective, setAnimatedReflective] = useState(0);
  const [animatedTopSignal, setAnimatedTopSignal] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nudgelens-history-v7");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const liveAnalysis = useMemo(() => analyseDecision(input), [input]);
  const current = savedAnalysis || liveAnalysis;
<<<<<<< HEAD

  useEffect(() => {
    if (!input) {
      setAnimatedPressure(0);
      setAnimatedReflective(0);
      setAnimatedTopSignal("");
      return;
    }

    let interval;

    function randomize() {
      setAnimatedPressure(Math.floor(Math.random() * 100));
      setAnimatedReflective(Math.floor(Math.random() * 100));
      setAnimatedTopSignal(
        Math.random() > 0.5
          ? current.results[0]?.name || "None"
          : "Analyzing..."
      );
    }

    randomize();
    interval = setInterval(randomize, 120);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setAnimatedPressure(current.pressure);
      setAnimatedReflective(current.reflectiveIndex);
      setAnimatedTopSignal(current.results[0]?.name || "None");
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [input, current]);
  const topBias = current.results[0];
  const hasInput = input.trim().length > 0;
  const accentColor =
    current.tone === "caution"
      ? "#d93025"
      : current.tone === "moderate"
      ? "#f29900"
      : "#188038";
  const glowColor =
    current.tone === "caution"
      ? "rgba(217,48,37,.22)"
      : current.tone === "moderate"
      ? "rgba(242,153,0,.24)"
      : "rgba(24,128,56,.22)";
=======
  const topBias = current.biasResults[0];
>>>>>>> 8ea08bd (upgrade detection engine v7)

  function runAnalysis() {
    const next = analyseDecision(input);
    setSavedAnalysis(next);

    if (input.trim()) {
      const record = {
        id: Date.now(),
        date: next.generatedAt,
        text: input,
        recommendation: next.recommendation,
        pressure: next.pressure,
        reflectiveIndex: next.reflectiveIndex,
        decisionType: next.decisionType,
        topBias: next.biasResults[0]?.name || "No strong bias"
      };
      const updated = [record, ...history].slice(0, 40);
      setHistory(updated);
      localStorage.setItem("nudgelens-history-v6", JSON.stringify(updated));
    }
  }

  function clearAll() {
    setInput("");
    setSavedAnalysis(null);
  }

  function exportData() {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nudgelens-research-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="nl-page" style={styles.page}>
      <style>{`
        @keyframes feedbackReveal {
          from {
            opacity: 0;
            transform: translateY(22px) scale(.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes borderGlow {
          0% {
            box-shadow: 0 0 0 rgba(26,115,232,0);
          }
          45% {
            box-shadow: 0 0 36px var(--glow);
          }
          100% {
            box-shadow: 0 8px 30px rgba(60,64,67,.11);
          }
        }

        @keyframes inputBreath {
          0% { box-shadow: 0 1px 6px rgba(32,33,36,.18); }
          50% { box-shadow: 0 8px 28px rgba(26,115,232,.16); }
          100% { box-shadow: 0 1px 6px rgba(32,33,36,.18); }
        }

        .feedback-reveal {
          opacity: 0;
          animation: feedbackReveal 620ms cubic-bezier(.2,.8,.2,1) forwards,
                     borderGlow 1300ms ease-out forwards;
        }

        .delay-1 { animation-delay: 80ms, 80ms; }
        .delay-2 { animation-delay: 220ms, 220ms; }
        .delay-3 { animation-delay: 360ms, 360ms; }
        .delay-4 { animation-delay: 500ms, 500ms; }
        .delay-5 { animation-delay: 650ms, 650ms; }

        @media (max-width: 640px) {
          body {
            overflow-x: hidden;
          }

          .nl-page {
            padding: 18px 14px !important;
            overflow-x: hidden !important;
          }

          .nl-shell {
            width: 100% !important;
            max-width: 430px !important;
            margin: 0 auto !important;
          }

          .nl-title {
            font-size: 30px !important;
            line-height: 1.12 !important;
            letter-spacing: -0.8px !important;
          }

          .nl-description {
            max-width: 340px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            font-size: 14px !important;
            line-height: 1.55 !important;
          }

          .nl-search-area {
            margin: 20px auto 26px !important;
          }

          .nl-search-box {
            min-height: 118px !important;
            border-radius: 28px !important;
            padding: 20px !important;
            font-size: 16px !important;
          }

          .nl-recommendation-card,
          .nl-analysis-card {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 28px !important;
            padding: 22px 18px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }

          .nl-top-row {
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .nl-decision-type {
            max-width: 155px !important;
            text-align: center !important;
            line-height: 1.25 !important;
          }

          .nl-recommendation-text {
            font-size: 30px !important;
            line-height: 1.12 !important;
            text-align: center !important;
            margin-top: 18px !important;
          }

          .nl-reason-text {
            font-size: 15px !important;
            line-height: 1.72 !important;
            text-align: center !important;
          }

          .nl-index-row {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            align-items: stretch !important;
            margin-top: 22px !important;
          }

          .nl-index-box {
            min-width: 0 !important;
            min-height: 92px !important;
            padding: 14px 8px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
            word-break: normal !important;
            overflow-wrap: normal !important;
          }

          .nl-index-box span {
            display: block !important;
            font-size: 13px !important;
            line-height: 1.25 !important;
            color: #3c4043 !important;
          }

          .nl-index-box strong {
            display: block !important;
            margin-top: 5px !important;
            font-size: 16px !important;
            line-height: 1.2 !important;
          }

          .nl-section-title {
            text-align: center !important;
            font-size: 24px !important;
            margin-bottom: 18px !important;
          }

          .nl-analysis-summary {
            text-align: center !important;
            padding: 18px 14px !important;
          }
        }
      `}</style>
      <div className="nl-shell" style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoDot}></span>
            <span style={styles.productName}>NudgeLens</span>
          </div>
<<<<<<< HEAD

          <h1 className="nl-title" style={styles.title}>Decision Reflection Assistant</h1>
          <p className="nl-description" style={styles.description}>
            Describe a decision in English or Chinese, and NudgeLens will identify possible behavioural pressure before you act.
          </p>
=======
          <h1 style={styles.title}>Decision Reflection Assistant</h1>
          <p style={styles.description}>Describe a decision in English or Chinese. NudgeLens identifies behavioural pressure before you act.</p>
>>>>>>> 8ea08bd (upgrade detection engine v7)
        </header>

        <main className="nl-search-area" style={styles.searchArea}>
          <textarea
            className="nl-search-box"
            style={{ ...styles.searchBox, animation: hasInput ? "inputBreath 2.8s ease-in-out infinite" : "none" }}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setSavedAnalysis(null);
            }}
            placeholder="Describe your decision here..."
          />
          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={runAnalysis}>Analyse decision</button>
            <button style={styles.secondaryButton} onClick={clearAll}>Clear</button>
          </div>
        </main>

        {hasInput && (
          <>
        <section
          className="feedback-reveal delay-1 nl-recommendation-card"
          style={{
            ...styles.recommendationCard,
            borderColor: accentColor,
            background: `linear-gradient(135deg, #ffffff 0%, ${glowColor} 100%)`,
            "--glow": glowColor
          }}
        >
          <div className="nl-top-row" style={styles.topRow}>
            <span style={styles.cardLabel}>General decision</span>
            <span className="nl-decision-type" style={styles.decisionType}>{current.decisionType}</span>
          </div>

<<<<<<< HEAD
          <h2
            className="nl-recommendation-text"
            style={{
              ...styles.recommendationText,
              color:
                current.tone === "caution"
                  ? "#d93025"
                  : current.tone === "moderate"
                  ? "#f29900"
                  : "#188038"
            }}
          >
=======
          <h2 style={{ ...styles.recommendationText, color: current.tone === "caution" ? "#d93025" : current.tone === "moderate" ? "#f29900" : "#188038" }}>
>>>>>>> 8ea08bd (upgrade detection engine v7)
            {current.recommendation}
          </h2>

          <p className="nl-reason-text" style={styles.reasonText}>
            {current.gptStyleOutput}
          </p>

<<<<<<< HEAD
          <div className="nl-index-row" style={styles.indexRow}>
            <div className="feedback-reveal delay-2 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Reflective index</span>
              <strong>{animatedReflective}</strong>
            </div>
            <div className="feedback-reveal delay-3 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Decision pressure</span>
              <strong>{animatedPressure}</strong>
            </div>
            <div className="feedback-reveal delay-4 nl-index-box" style={{ ...styles.indexBox, borderColor: accentColor, "--glow": glowColor }}>
              <span>Top signal</span>
              <strong>{animatedTopSignal}</strong>
            </div>
=======
          <div style={styles.indexRow}>
            <div style={styles.indexBox}><span>Reflective index</span><strong>{current.reflectiveIndex}</strong></div>
            <div style={styles.indexBox}><span>Decision pressure</span><strong>{current.pressure}</strong></div>
            <div style={styles.indexBox}><span>Top signal</span><strong>{topBias ? topBias.name : "None"}</strong></div>
>>>>>>> 8ea08bd (upgrade detection engine v7)
          </div>
        </section>

        <section
          className="feedback-reveal delay-5 nl-analysis-card"
          style={{ ...styles.analysisCard, borderColor: accentColor, "--glow": glowColor }}
        >
          <h3 className="nl-section-title" style={styles.sectionTitle}>Analysis</h3>

          {topBias ? (
            <div className="nl-analysis-summary" style={styles.analysisSummary}>
              <strong>{topBias.name}</strong>
              <p>{topBias.interpretation}</p>
              <p>{topBias.nudge}</p>
            </div>
          ) : (
            <p style={styles.mutedText}>No strong bias is visible yet. Add more context about price, urgency, social pressure, uncertainty, evidence, or alternatives for richer analysis.</p>
          )}

          <details style={styles.detailsBox}>
            <summary style={styles.detailsSummary}>Show detailed reasoning</summary>
            {current.biasResults.length === 0 ? (
              <p style={styles.mutedText}>No detailed bias signals detected.</p>
            ) : (
              current.biasResults.map((bias) => (
                <div key={bias.id} style={styles.biasBox}>
                  <div style={styles.biasHeader}>
                    <div><strong>{bias.name}</strong><p>{bias.label}</p></div>
                    <span style={styles.biasScore}>{bias.level} · {bias.score}</span>
                  </div>
                  <p><b>Evidence:</b> {bias.evidence.length ? bias.evidence.join(", ") : "implicit contextual signal"}</p>
                  <p><b>Interpretation:</b> {bias.interpretation}</p>
                  <p><b>Nudge:</b> {bias.nudge}</p>
                  <p><b>Reflection:</b> {bias.question}</p>
                </div>
              ))
            )}
          </details>

          <details style={styles.detailsBox}>
            <summary style={styles.detailsSummary}>Protective reasoning signals</summary>
            {current.protectiveHits.length === 0 ? <p style={styles.mutedText}>No protective reasoning signals detected.</p> : <p style={styles.mutedText}>{current.protectiveHits.join(", ")}</p>}
          </details>

          <details style={styles.detailsBox}>
            <summary style={styles.detailsSummary}>Research history and export</summary>
            <button style={styles.secondaryButton} onClick={exportData}>Export JSON</button>
            <button style={styles.secondaryButton} onClick={() => { setHistory([]); localStorage.removeItem("nudgelens-history-v6"); }}>Clear history</button>
            {history.length === 0 ? <p style={styles.mutedText}>No saved decisions yet.</p> : history.map((item) => (
              <div key={item.id} style={styles.historyItem}>
                <span>{item.date} · {item.decisionType}</span>
                <p>{item.text}</p>
                <strong>{item.recommendation} · {item.topBias}</strong>
              </div>
            ))}
          </details>
        </section>
          </>
        )}
      </div>
      <Analytics />
    </div>
  );
}

const styles = {
<<<<<<< HEAD
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #f8fbff 0%, #ffffff 44%)",
    color: "#202124",
    fontFamily: "Arial, sans-serif",
    padding: "28px",
    boxSizing: "border-box",
    overflowX: "hidden"
  },
  shell: {
    width: "100%",
    maxWidth: "980px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    paddingTop: "20px",
    paddingBottom: "12px"
  },
  logoRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  logoDot: {
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    background: "linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335)"
  },
  productName: {
    color: "#5f6368",
    fontWeight: 600
  },
  title: {
    fontSize: "42px",
    lineHeight: 1.1,
    fontWeight: 600,
    letterSpacing: "-1.4px",
    margin: 0,
    color: "#1a73e8"
  },
  description: {
    color: "#5f6368",
    fontSize: "16px",
    lineHeight: 1.6,
    marginTop: "12px"
  },
  searchArea: {
    maxWidth: "860px",
    margin: "24px auto 22px",
    textAlign: "center"
  },
  searchBox: {
    width: "100%",
    minHeight: "132px",
    border: "1px solid #dadce0",
    borderRadius: "34px",
    padding: "22px 28px",
    fontSize: "17px",
    lineHeight: 1.65,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "0 1px 6px rgba(32,33,36,.18)",
    color: "#202124",
    background: "#ffffff"
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "18px"
  },
  primaryButton: {
    background: "#1a73e8",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    padding: "12px 22px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px"
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#1a73e8",
    border: "1px solid #dadce0",
    borderRadius: "999px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "8px",
    marginTop: "8px"
  },
  recommendationCard: {
    border: "1.5px solid #dadce0",
    borderRadius: "30px",
    padding: "26px",
    background: "#ffffff",
    boxShadow: "0 8px 30px rgba(60,64,67,.11)",
    marginBottom: "20px",
    boxSizing: "border-box"
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center"
  },
  cardLabel: {
    color: "#5f6368",
    fontSize: "13px",
    fontWeight: 600
  },
  decisionType: {
    color: "#5f6368",
    background: "#f1f3f4",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "13px"
  },
  recommendationText: {
    fontSize: "38px",
    lineHeight: 1.1,
    marginTop: "14px",
    marginBottom: "14px",
    letterSpacing: "-1px"
  },
  reasonText: {
    color: "#3c4043",
    fontSize: "16px",
    lineHeight: 1.7,
    margin: "8px 0"
  },
  indexRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "20px"
  },
  indexBox: {
    background: "#f8fafd",
    border: "1.5px solid #e8eaed",
    borderRadius: "22px",
    padding: "16px",
    boxSizing: "border-box",
    textAlign: "center"
  },
  analysisCard: {
    border: "1.5px solid #dadce0",
    borderRadius: "30px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 8px 30px rgba(60,64,67,.11)",
    boxSizing: "border-box"
  },
  sectionTitle: {
    marginTop: 0,
    fontSize: "22px"
  },
  analysisSummary: {
    background: "#f8fafd",
    border: "1px solid #e8eaed",
    borderRadius: "24px",
    padding: "18px",
    lineHeight: 1.7,
    marginBottom: "14px"
  },
  mutedText: {
    color: "#5f6368",
    lineHeight: 1.7
  },
  detailsBox: {
    borderTop: "1px solid #e8eaed",
    paddingTop: "14px",
    marginTop: "14px"
  },
  detailsSummary: {
    cursor: "pointer",
    color: "#1a73e8",
    fontWeight: 600,
    marginBottom: "12px"
  },
  biasBox: {
    border: "1px solid #e8eaed",
    borderRadius: "22px",
    padding: "16px",
    lineHeight: 1.65,
    marginTop: "12px"
  },
  biasHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start"
  },
  biasScore: {
    background: "#e8f0fe",
    color: "#1967d2",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap"
  },
  historyItem: {
    borderTop: "1px solid #e8eaed",
    paddingTop: "12px",
    marginTop: "12px",
    lineHeight: 1.6,
    color: "#3c4043"
  }
};
=======
  page: { minHeight: "100vh", background: "#ffffff", color: "#202124", fontFamily: "Arial, sans-serif", padding: "28px" },
  shell: { maxWidth: "980px", margin: "0 auto" },
  header: { textAlign: "center", paddingTop: "20px", paddingBottom: "12px" },
  logoRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "16px" },
  logoDot: { width: "14px", height: "14px", borderRadius: "999px", background: "linear-gradient(135deg,#4285f4,#34a853,#fbbc05,#ea4335)" },
  productName: { color: "#5f6368", fontWeight: 600 },
  title: { fontSize: "42px", lineHeight: 1.1, fontWeight: 600, letterSpacing: "-1.4px", margin: 0 },
  description: { color: "#5f6368", fontSize: "16px", lineHeight: 1.6, marginTop: "12px" },
  searchArea: { maxWidth: "860px", margin: "24px auto 22px", textAlign: "center" },
  searchBox: { width: "100%", minHeight: "132px", border: "1px solid #dadce0", borderRadius: "34px", padding: "22px 28px", fontSize: "17px", lineHeight: 1.65, resize: "vertical", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 6px rgba(32,33,36,.18)", color: "#202124", background: "#ffffff" },
  actions: { display: "flex", justifyContent: "center", gap: "12px", marginTop: "18px" },
  primaryButton: { background: "#1a73e8", color: "#ffffff", border: "none", borderRadius: "999px", padding: "12px 22px", cursor: "pointer", fontWeight: 600, fontSize: "14px" },
  secondaryButton: { background: "#ffffff", color: "#1a73e8", border: "1px solid #dadce0", borderRadius: "999px", padding: "11px 18px", cursor: "pointer", fontWeight: 600, marginRight: "8px", marginTop: "8px" },
  recommendationCard: { border: "1px solid #dadce0", borderRadius: "30px", padding: "26px", background: "#ffffff", boxShadow: "0 1px 2px rgba(60,64,67,.08), 0 2px 8px rgba(60,64,67,.08)", marginBottom: "20px" },
  topRow: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" },
  cardLabel: { color: "#5f6368", fontSize: "13px", fontWeight: 600 },
  decisionType: { color: "#5f6368", background: "#f1f3f4", borderRadius: "999px", padding: "7px 12px", fontSize: "13px" },
  recommendationText: { fontSize: "38px", lineHeight: 1.1, marginTop: "14px", marginBottom: "14px", letterSpacing: "-1px" },
  reasonText: { color: "#3c4043", fontSize: "16px", lineHeight: 1.7, margin: "8px 0" },
  indexRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "20px" },
  indexBox: { background: "#f8fafd", border: "1px solid #e8eaed", borderRadius: "22px", padding: "16px" },
  analysisCard: { border: "1px solid #dadce0", borderRadius: "30px", padding: "24px", background: "#ffffff", boxShadow: "0 1px 2px rgba(60,64,67,.08), 0 2px 8px rgba(60,64,67,.08)" },
  sectionTitle: { marginTop: 0, fontSize: "22px" },
  analysisSummary: { background: "#f8fafd", border: "1px solid #e8eaed", borderRadius: "24px", padding: "18px", lineHeight: 1.7, marginBottom: "14px" },
  mutedText: { color: "#5f6368", lineHeight: 1.7 },
  detailsBox: { borderTop: "1px solid #e8eaed", paddingTop: "14px", marginTop: "14px" },
  detailsSummary: { cursor: "pointer", color: "#1a73e8", fontWeight: 600, marginBottom: "12px" },
  biasBox: { border: "1px solid #e8eaed", borderRadius: "22px", padding: "16px", lineHeight: 1.65, marginTop: "12px" },
  biasHeader: { display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" },
  biasScore: { background: "#e8f0fe", color: "#1967d2", borderRadius: "999px", padding: "7px 11px", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" },
  historyItem: { borderTop: "1px solid #e8eaed", paddingTop: "12px", marginTop: "12px", lineHeight: 1.6, color: "#3c4043" }
};
>>>>>>> 8ea08bd (upgrade detection engine v7)
