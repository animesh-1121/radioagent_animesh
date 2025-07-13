'use server';

/**
 * @fileOverview Correlates patient symptoms with medical image analysis findings.
 *
 * - correlateSymptoms - Correlates symptoms with findings to suggest potential conditions.
 * - CorrelateSymptomsInput - The input type for the correlateSymptoms function.
 * - CorrelateSymptomsOutput - The return type for the correlateSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrelateSymptomsInputSchema = z.object({
  symptoms: z.string().describe('A comma-separated list of patient symptoms.'),
  findings: z.string().describe('The key findings from the medical image analysis.'),
  anomalies: z.string().describe('The anomalies detected in the medical image.'),
});
export type CorrelateSymptomsInput = z.infer<typeof CorrelateSymptomsInputSchema>;

const CorrelateSymptomsOutputSchema = z.object({
  potentialConditions: z.array(z.object({
    condition: z.string().describe('The name of the potential medical condition.'),
    confidence: z.enum(['High', 'Medium', 'Low']).describe('The confidence level of this potential condition.'),
    reasoning: z.string().describe('The reasoning for suggesting this condition based on the inputs.'),
  })).describe('A ranked list of potential conditions.'),
  suggestedNextSteps: z.string().describe('Suggested next steps, such as further tests or specialist consultations.'),
});
export type CorrelateSymptomsOutput = z.infer<typeof CorrelateSymptomsOutputSchema>;


export async function correlateSymptoms(input: CorrelateSymptomsInput): Promise<CorrelateSymptomsOutput> {
  return correlateSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correlateSymptomsPrompt',
  input: {schema: CorrelateSymptomsInputSchema},
  output: {schema: CorrelateSymptomsOutputSchema},
  prompt: `You are an expert medical diagnostician AI. Your role is to correlate patient symptoms with radiological findings to assist healthcare professionals.

Analyze the following information:
- Patient Symptoms: {{{symptoms}}}
- Key Findings from Imaging: {{{findings}}}
- Detected Anomalies from Imaging: {{{anomalies}}}

Based on this data, provide a differential diagnosis. For each potential condition, provide a confidence level (High, Medium, Low) and a brief reasoning that connects the symptoms and imaging data.

Finally, suggest clear and concise next steps, such as recommended further tests (e.g., blood tests, biopsy, other imaging modalities) or specialist consultations.

Structure your output according to the provided schema.
`,
});

const correlateSymptomsFlow = ai.defineFlow(
  {
    name: 'correlateSymptomsFlow',
    inputSchema: CorrelateSymptomsInputSchema,
    outputSchema: CorrelateSymptomsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
