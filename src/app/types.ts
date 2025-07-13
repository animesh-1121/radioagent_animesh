import { z } from 'zod';

export const GenerateBasicReportInputSchema = z.object({
  findings: z.string().describe('The key findings from the medical image analysis.'),
  anomalies: z.string().describe('The anomalies detected in the medical image.'),
});
export type GenerateBasicReportInput = z.infer<typeof GenerateBasicReportInputSchema>;

export const GenerateBasicReportOutputSchema = z.object({
  markdownReport: z.string().describe('The basic diagnostic report formatted in Markdown.'),
});
export type GenerateBasicReportOutput = z.infer<typeof GenerateBasicReportOutputSchema>;
