"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function parseEmailContext(emailText: string, apiKey: string) {
  if (!apiKey) throw new Error("Missing Gemini API Key");

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      intent: { type: Type.STRING, description: "Classify intent: e.g., 'Interview Request', 'Rejection', 'Offer', 'General Update'" },
      suggestedStatus: { type: Type.STRING, description: "Must be exactly one of: 'Shortlisted', 'Applied', 'Interviewing', 'Offer'. If rejection, use 'Discovered' or suggest archiving." },
      draftResponse: { type: Type.STRING, description: "A tailored, context-aware executive response draft that can be copied." },
      extractedCompany: { type: Type.STRING, description: "Try to guess the company name this email refers to."}
    },
    required: ["intent", "suggestedStatus", "draftResponse", "extractedCompany"]
  };

  const prompt = `
    You are an executive assistant parsing an incoming recruiter or system email for a senior candidate.
    Analyze the text and determine the next workflow step and draft a highly professional response.

    EMAIL TEXT:
    ${emailText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");

    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(error.message || "Failed to parse email context.");
  }
}
