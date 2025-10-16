/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from "@google/genai";

// This is a serverless function that will be hosted by your deployment platform (e.g., Vercel, Netlify).
// It safely handles the API key on the server-side.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Initialize with the API key from server-side environment variables
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const modelSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The name of the AI model." },
                description: { type: Type.STRING, description: "A brief, one-sentence summary of the AI model's capabilities for a card view." },
                longDescription: { type: Type.STRING, description: "A detailed paragraph describing the model, its features, and common use cases for a detail page." },
                primaryFunction: { type: Type.STRING, description: "The primary function or category of the model (e.g., Text Generation, Image Generation, Code Generation)." },
                websiteUrl: { type: Type.STRING, description: "The official URL or homepage for the AI model." },
                pricingModel: { type: Type.STRING, description: "The pricing structure. Common values are 'Free', 'Freemium', 'Subscription', or 'One-time Purchase'." }
            },
            required: ["name", "description", "longDescription", "primaryFunction", "websiteUrl", "pricingModel"],
        };

        const prompt = `You are an AI model encyclopedia. Find AI models related to the query: "${query}". For each model, provide all the requested details in the JSON schema. Return a list of the most relevant models.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: modelSchema },
            },
        });

        const jsonStr = response.text.trim();
        const models = JSON.parse(jsonStr);

        // Send the successful response back to the frontend
        res.status(200).json(models);

    } catch (error) {
        console.error("Error in serverless function:", error);
        res.status(500).json({ error: 'Failed to fetch AI models from the API.' });
    }
}
