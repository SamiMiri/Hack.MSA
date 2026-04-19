import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/explain", async (req, res) => {
  const { choice, feedback, scene, character, scenarioName } = req.body as {
    choice: string;
    feedback: string;
    scene: string;
    character: string;
    scenarioName: string;
  };

  if (!choice || !feedback) {
    res.status(400).json({ error: "choice and feedback are required" });
    return;
  }

  try {
    const prompt = `You are a life skills coach for young adults. A player in "Adulting Simulator" (${scenarioName}) playing as ${character || "a young adult"} just chose: "${choice}" in the scene "${scene}".

Game feedback given: "${feedback}"

Give the player ONE practical real-world insight about why this matters in real life (2 sentences, specific and concrete — mention a real law, number, or consequence). Then give TWO short follow-up questions to encourage reflection.

Respond ONLY as valid JSON:
{"explanation":"...","followUpQuestions":["...","..."]}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "user", content: prompt },
      ],
    });

    const rawChoice = completion.choices[0];
    const content = rawChoice?.message?.content ?? "";
    console.log("AI response:", JSON.stringify({ finishReason: rawChoice?.finish_reason, contentLength: content.length, preview: content.slice(0, 100) }));

    let parsed: { explanation: string; followUpQuestions: string[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        explanation: content.slice(0, 400),
        followUpQuestions: [],
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

export default router;
