"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PROFILE_BASELINE } from "@/config/profile";

export async function parseJobDescription(jdText: string, locationContext: string, apiKey: string) {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key");
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      company: { type: Type.STRING, description: "Extract company name, or 'Unknown' if not present" },
      location: { type: Type.STRING, description: "Extract location, standardize if possible" },
      matchScore: {
        type: Type.INTEGER,
        description: "0-100 score based on how well the jd matches the provided PROFILE_BASELINE. Consider multi-cloud scale, GenAI voice bot latency, and RBI/FinOps governance."
      },
      matchPros: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Sharp bullet points on why this is a good match based on the baseline profile."
      },
      matchCons: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Sharp bullet points on potential gaps or misalignments."
      },
      coreTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-5 hashtag style tags, e.g. #Databricks, #FinOps, #GenAI"
      },
      cleanDescription: {
        type: Type.STRING,
        description: "Markdown string. Strip out company overviews, generic perks. KEEP ONLY raw responsibilities and hard requirements."
      },
      hiddenAssets: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Implied unstated requirements that the candidate fulfills based on the baseline."
      },
      frictionPoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Unspoken cultural or local regulatory hurdles based on the geography."
      }
    },
    required: ["title", "company", "location", "matchScore", "matchPros", "matchCons", "coreTags", "cleanDescription", "hiddenAssets", "frictionPoints"]
  };

  const prompt = `
    You are an expert executive search semantic matcher. Analyze the provided Job Description against this Ground Truth Executive Profile.

    GROUND TRUTH PROFILE:
    ${JSON.stringify(PROFILE_BASELINE, null, 2)}

    JOB DESCRIPTION:
    ${jdText}

    GEOGRAPHIC CONTEXT HINT: ${locationContext}

    Return a strictly formatted JSON analyzing the match.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    throw new Error(error.message || "Failed to parse job description.");
  }
}
