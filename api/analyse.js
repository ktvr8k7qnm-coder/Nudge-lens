export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY environment variable"
    });
  }

  const input = req.body?.input?.trim();
  if (!input) {
    return res.status(400).json({ error: "Missing input text" });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a professional decision analyst. Return ONLY valid JSON with keys: summary, risk, advice, score, pressure, signal. score and pressure must be integers 0-100. signal must be one of STOP, CAUTION, PROCEED."
          },
          {
            role: "user",
            content: `Analyze this decision input and return JSON only.\n\nInput:\n${input}\n\nRules:\n- summary: concise practical summary\n- risk: key risks and uncertainty\n- advice: specific next steps\n- score: decision quality score 0-100 (higher is better)\n- pressure: pressure index 0-100 (higher means more pressure)\n- signal: STOP, CAUTION, or PROCEED`
          }
        ]
      })
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      const message = data?.error?.message || "OpenAI request failed";
      return res.status(openaiRes.status).json({ error: message });
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: "No analysis returned from OpenAI" });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "OpenAI returned invalid JSON" });
    }

    const summary = parsed?.summary?.toString?.().trim();
    const risk = parsed?.risk?.toString?.().trim();
    const advice = parsed?.advice?.toString?.().trim();
    const score = Number(parsed?.score);
    const pressure = Number(parsed?.pressure);
    const signal = parsed?.signal?.toString?.().trim().toUpperCase();

    const signalOk = signal === "STOP" || signal === "CAUTION" || signal === "PROCEED";
    const scoreOk = Number.isFinite(score) && score >= 0 && score <= 100;
    const pressureOk = Number.isFinite(pressure) && pressure >= 0 && pressure <= 100;

    if (!summary || !risk || !advice || !signalOk || !scoreOk || !pressureOk) {
      return res.status(502).json({ error: "Incomplete analysis returned from OpenAI" });
    }

    return res.status(200).json({
      summary,
      risk,
      advice,
      score: Math.round(score),
      pressure: Math.round(pressure),
      signal
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate analysis",
      details: error?.message || "Unknown error"
    });
  }
}