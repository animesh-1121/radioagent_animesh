'use server';

/**
 * @fileOverview A flow for detecting anomalies in medical images.
 *
 * - detectAnomalies - A function that detects anomalies in a medical image.
 * - DetectAnomaliesInput - The input type for the detectAnomalies function.
 * - DetectAnomaliesOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const DetectAnomaliesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A medical image (X-ray, CT scan, MRI, ultrasound) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const DetectAnomaliesOutputSchema = z.object({
  anomalies: z
    .string()
    .describe(
      'A description of any unusual anomalies detected in the medical image.'
    ),
});
export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;

export async function detectAnomalies(input: DetectAnomaliesInput): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  prompt: `You are an expert radiologist specializing in identifying anomalies in medical images.

You will use this information to detect any unusual anomalies in the image.

Use the following image as the primary source of information:

Image: {{media url=photoDataUri}}

Describe the unusual anomalies.
`,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
