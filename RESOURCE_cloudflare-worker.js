// RESOURCE_cloudflare-worker.js

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }

      const apiUrl = "https://api.openai.com/v1/chat/completions";
      const userInput = await request.json();

      // Brand-guarded, topical system prompt (always prepended)
      const systemPrompt = {
        role: "system",
        content: [
          "You are L'Oréal's Smart Product Advisor.",
          "Only answer questions about L'Oréal (brands, products, routines, ingredients, shade-matching, hair/skin concerns, how-to use).",
          "If a question is unrelated, politely refuse and steer back to beauty/L'Oréal topics.",
          "Be concise, friendly, and practical. When uncertain, ask a brief clarifying question.",
          "Never provide medical advice; recommend consulting a professional for medical conditions.",
        ].join(" "),
      };

      const incomingMessages = Array.isArray(userInput?.messages)
        ? userInput.messages
        : [];

      const requestBody = {
        model: "gpt-4o",
        messages: [systemPrompt, ...incomingMessages],
        // correct param name for Chat Completions:
        max_tokens: 300,
      };

      const upstream = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await upstream.json();
      return new Response(JSON.stringify(data), {
        status: upstream.status,
        headers: corsHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
