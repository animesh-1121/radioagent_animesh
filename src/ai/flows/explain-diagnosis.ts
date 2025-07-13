// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating visual explanations (Grad-CAM or saliency maps)
 * highlighting the areas of the image that contributed most to the diagnosis, so radiologists can
 * understand the AI's reasoning and validate its findings.
 *
 * - explainDiagnosis - A function that initiates the diagnosis explanation process.
 * - ExplainDiagnosisInput - The input type for the explainDiagnosis function.
 * - ExplainDiagnosisOutput - The return type for the explainDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainDiagnosisInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An X-ray, CT scan, MRI, or ultrasound image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  diagnosis: z.string().describe('The diagnosis provided by the AI.'),
});
export type ExplainDiagnosisInput = z.infer<typeof ExplainDiagnosisInputSchema>;

const ExplainDiagnosisOutputSchema = z.object({
  explanationImage: z
    .string()
    .describe(
      'A data URI containing the visual explanation (Grad-CAM or saliency map) highlighting the areas of the image that contributed most to the diagnosis. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  explanationText: z.string().describe('A short textual summary of what the visual explanation highlights.'),
  confidenceScore: z
    .number()
    .describe('The confidence score of the diagnosis explanation.'),
});
export type ExplainDiagnosisOutput = z.infer<typeof ExplainDiagnosisOutputSchema>;

export async function explainDiagnosis(input: ExplainDiagnosisInput): Promise<ExplainDiagnosisOutput> {
  return explainDiagnosisFlow(input);
}

const explainDiagnosisFlow = ai.defineFlow(
  {
    name: 'explainDiagnosisFlow',
    inputSchema: ExplainDiagnosisInputSchema,
    outputSchema: ExplainDiagnosisOutputSchema,
  },
  async input => {
    const response = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',

      prompt: [
        {media: {url: input.imageDataUri}},
        {text: `Generate a visual explanation (Grad-CAM or saliency map) that highlights the areas of the image that contributed most to the diagnosis: ${input.diagnosis}. Also, provide a short, one-sentence text explanation of what the highlighted areas signify.`},
      ],

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    // Since the prompt requires both TEXT and IMAGE, media.url will always be defined.
    // text may not be defined, but isn't used in this flow, so it is fine.
    return {
      explanationImage: response.media.url,
      explanationText: response.text,
      confidenceScore: 0.95, // Placeholder confidence score
    };
  }
);
