import { GoogleGenAI } from "@google/genai";
import { DocumentFile, Message } from '../types';

// Helper to estimate tokens (rough approximation: 4 chars = 1 token)
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export const streamGeminiResponse = async (
  history: Message[],
  currentPrompt: string,
  documents: DocumentFile[],
  onChunk: (text: string) => void
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Construct context from documents
  // In a real production RAG, this would use vector retrieval.
  // For this app, we use Gemini's massive context window to inject relevant docs directly.
  const contextString = documents
    .filter(doc => doc.status === 'ready')
    .map(doc => `--- DOCUMENT START: ${doc.name} ---\n${doc.content}\n--- DOCUMENT END: ${doc.name} ---`)
    .join('\n\n');

  const systemInstruction = `You are an intelligent RAG (Retrieval Augmented Generation) assistant.
  You have access to a set of documents provided below.
  
  INSTRUCTIONS:
  1. Answer the user's question based PRIMARILY on the provided documents.
  2. If the answer is found in the documents, cite the source using the format [Source: filename.ext].
  3. If the answer is not in the documents, you may use your general knowledge but clearly state that it's not from the uploaded files.
  4. Be concise, professional, and helpful.
  5. Format your response in Markdown.

  DOCUMENTS:
  ${contextString}
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more factual responses
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessageStream({ message: currentPrompt });
    
    let fullText = '';
    for await (const chunk of result) {
        if (chunk.text) {
            fullText += chunk.text;
            onChunk(fullText);
        }
    }
    return fullText;

  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
};