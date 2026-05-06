export default async function handler(req, res) {
  try {
    const { input } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are a decision advisor.

Analyze this decision:

${input}

Return:
1. Summary
2. Risk
3. Advice`
      }),
    });

    const data = await response.json();

    res.status(200).json({
      result: data.output?.[0]?.content?.[0]?.text || "No response"
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}