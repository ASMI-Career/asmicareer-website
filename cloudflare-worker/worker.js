/**
 * ASMI Career — AI Report Proxy
 * Cloudflare Worker: proxies /api/ai-report → Gemini API
 * API key stored as a Cloudflare secret (never exposed to browser)
 */

const ALLOWED_ORIGIN = "https://asmicareer.in";
const GEMINI_MODEL = "gemini-flash-latest";

export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(ALLOWED_ORIGIN),
      });
    }

    // Only allow POST to /api/ai-report
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/api/ai-report") {
      return new Response("Not found", { status: 404 });
    }

    // Parse incoming request
    let prompt;
    try {
      const body = await request.json();
      prompt = body.prompt;
      if (!prompt || typeof prompt !== "string") throw new Error("Missing prompt");
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(ALLOWED_ORIGIN) },
      });
    }

    // Call Gemini API
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini API error:", errText);
        return new Response(JSON.stringify({ error: "Gemini API error", text: "" }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders(ALLOWED_ORIGIN) },
        });
      }

      const geminiData = await geminiRes.json();
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return new Response(JSON.stringify({ text }), {
        headers: { "Content-Type": "application/json", ...corsHeaders(ALLOWED_ORIGIN) },
      });

    } catch (err) {
      console.error("Worker error:", err);
      return new Response(JSON.stringify({ error: "Internal error", text: "" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(ALLOWED_ORIGIN) },
      });
    }
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
