const axios = require("axios");

/**
 * Groq API AI Service
 * Compatible with OpenAI API format for ultra-fast Llama-3.3 / Mixtral inference
 */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq 100% Free Tier Models in Priority Order
const FREE_GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
];

exports.generateGroqCompletion = async (prompt, systemPrompt = "You are an expert structural engineer and construction BOQ cost estimator in Bangladesh complying with BNBC 2020 codes.") => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_groq_api_key_here") {
        return null; // Fallback to BNBC structural formula engine
    }

    const preferredModel = process.env.GROQ_MODEL || FREE_GROQ_MODELS[0];
    const modelQueue = [preferredModel, ...FREE_GROQ_MODELS.filter(m => m !== preferredModel)];

    for (const model of modelQueue) {
        try {
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 512
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey.trim()}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 7000
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) return content;
        } catch (error) {
            console.warn(`Groq Free Model (${model}) Warning:`, error.response?.data?.error?.message || error.message);
            // Continue to next free tier model in queue
        }
    }

    return null;
};
