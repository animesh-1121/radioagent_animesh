'use server';

/**
 * @fileOverview Medical image analysis AI agent.
 *
 * - analyzeMedicalImage - A function that handles the medical image analysis process.
 * - AnalyzeMedicalImageInput - The input type for the analyzeMedicalImage function.
 * - AnalyzeMedicalImageOutput - The return type for the analyzeMedicalImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMedicalImageInputSchema = z.object({
  photoDataUris: z
    .array(z.string())
    .describe(
      "A series of medical images (X-ray, CT, MRI) or a video (ultrasound) as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMedicalImageInput = z.infer<typeof AnalyzeMedicalImageInputSchema>;

const AnalyzeMedicalImageOutputSchema = z.object({
  findings: z.string().describe('A mandatory, concise summary (max 20 words) stating the most likely disease, any secondary findings, and its potential progression.'),
  anomalies: z.string().describe('Potential anomalies or areas of interest identified in the content.'),
});
export type AnalyzeMedicalImageOutput = z.infer<typeof AnalyzeMedicalImageOutputSchema>;

export async function analyzeMedicalImage(input: AnalyzeMedicalImageInput): Promise<AnalyzeMedicalImageOutput> {
  return analyzeMedicalImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMedicalImagePrompt',
  input: {schema: AnalyzeMedicalImageInputSchema},
  output: {schema: AnalyzeMedicalImageOutputSchema},
  prompt: `You are an expert radiologist. Analyze the provided medical content.

**Instructions for 'findings' output:**
Your response is MANDATORY and must be a single, concise sentence of 20 words or less. It MUST follow this structure:
1.  Start with the most likely primary diagnosis.
2.  Follow with any significant secondary finding or observation.
3.  Conclude with the risk or potential for progression if left untreated.
Example: "Likely Pneumonia with severe left lung infection; possible early lung tumor—risk of pleural effusion if untreated."

**Instructions for 'anomalies' output:**
- List any other observed anomalies or areas of interest.

Analyze the entire series/video and provide your response according to these strict instructions.

{{#each photoDataUris}}
Content piece {{index}}: {{media url=.}}
{{/each}}
`,
});

const analyzeMedicalImageFlow = ai.defineFlow(
  {
    name: 'analyzeMedicalImageFlow',
    inputSchema: AnalyzeMedicalImageInputSchema,
    outputSchema: AnalyzeMedicalImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
