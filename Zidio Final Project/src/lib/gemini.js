import { GoogleGenAI } from "@google/genai";

// Use Vite's import.meta.env for environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

export async function analyzeData(payload) {
    const { chartTitle, chartType, data, headers } = payload;

    const prompt = `You are an expert data analyst.

1. Give a clear summary of what is happening in this chart (title: ${chartTitle}, type: ${chartType}).
2. Provide two detailed insights, each as a separate point.
3. Suggest one actionable improvement or next step.

Be specific and use the data provided. Format your answer as a plain, short, bulleted list (not JSON, not code block).

Columns: ${headers ? headers.join(", ") : Object.keys(data[0] || {}).join(", ")}
Total rows: ${data.length}

Data:
${data.map(row => JSON.stringify(row)).join('\n')}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
    });
    let aiText = "";
    try {
        aiText = response?.candidates?.[0]?.content?.parts?.[0]?.text
            || response?.candidates?.[0]?.content?.parts?.[0]
            || "No analysis found.";
    } catch {
        aiText = "No analysis found.";
    }
    return aiText;
}