'use server';

/**
 * @fileOverview Generates a basic, image-only diagnostic report.
 *
 * - generateBasicReport - A function that generates the basic report.
 */

import {ai} from '@/ai/genkit';
import { GenerateBasicReportInputSchema, GenerateBasicReportOutputSchema, type GenerateBasicReportInput, type GenerateBasicReportOutput } from '@/app/types';


export async function generateBasicReport(
  input: GenerateBasicReportInput
): Promise<GenerateBasicReportOutput> {
  return generateBasicReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBasicReportPrompt',
  input: {schema: GenerateBasicReportInputSchema},
  output: {schema: GenerateBasicReportOutputSchema},
  prompt: `You are an expert radiologist and an AI-powered clinical decision support system. Your task is to generate a comprehensive, structured diagnostic report based on the provided findings from a medical image or image series.

**Your process must be as follows:**
1.  **Analyze the provided findings and anomalies** to understand the image content. If confidence is high, you MUST state the most likely primary diagnosis (e.g., "Rectal Cancer," "Pneumonia," "Meningioma"). Do not be vague if the evidence is strong.
2.  **Identify the primary anatomical region** being examined (e.g., Chest, Brain, Pelvis, Knee, Abdomen, etc.).
3.  **Generate a structured report** that is clinically appropriate for THAT SPECIFIC anatomical region. Do NOT use a chest/lung template for a brain scan, and vice-versa. Tailor the sections to the anatomy.
4.  The report must be detailed, clinically relevant, and formatted precisely in Markdown using the structure below.

**Analyze the provided information:**
- Key Findings: {{{findings}}}
- Detected Anomalies: {{{anomalies}}}

**MANDATORY REPORT STRUCTURE - Populate all sections of this template based on the identified anatomy:**

## 📌 **Findings Summary – Structured Radiology Format**

---

### **[Anatomical Region 1, e.g., Frontal Lobe or Left Lung or Rectum]**

*   **Finding:** [Describe the primary finding for this region. Be specific and state the likely diagnosis, e.g., "Large, irregular mass consistent with rectal carcinoma" or "Airspace consolidation consistent with pneumonic infiltrate".]
*   **Confidence Level:** [Provide a numerical percentage, e.g., "**97.1%**"] ([State High/Medium/Low])
*   **Severity Assessment:** [State "Severe", "Moderate", "Mild", or "Normal"]
*   **Detailed Notes:** [Provide detailed radiological observations. Be descriptive and technical, relevant to the anatomy.]
*   **Clinical Suggestion:** [Suggest a specific clinical action, like recommended medication, further tests, or management.]
*   **Emerging Disease Alert (Prediction):** [Based on patterns, suggest a potential differential diagnosis or future risk. Be specific.]

---

### **[Anatomical Region 2, e.g., Cerebellum or Cardiac Silhouette or Sigmoid Colon]**

*   **Finding:** [Describe the primary finding for this region.]
*   **Confidence Level:** [Provide a numerical percentage] ([State High/Medium/Low])
*   **Severity Assessment:** [State "Severe", "Moderate", "Mild", or "Normal"]
*   **Detailed Notes:** [Provide detailed radiological observations.]
*   **Clinical Suggestion:** [Suggest a specific clinical action.]
*   **Emerging Disease Alert (Prediction):** [Suggest a potential differential diagnosis or future risk.]

---

*(Add more anatomical region sections as necessary based on the image analysis)*

---

## 🔍 **AI-Driven Clinical Recommendations Summary**

[Provide a numbered list of 3-5 clear, consolidated, actionable recommendations based on the overall findings.]

---

### ⚠️ **Disclaimer**

> *This is an AI-generated diagnostic suggestion and should only be used to assist clinical judgment. Final diagnosis, prescriptions, and interventions should be made by a licensed healthcare provider based on patient history, lab tests, and physical examination.*
---

Now, generate the complete report by filling in the 'markdownReport' field in the output schema with the fully populated Markdown text. Ensure all sections are filled out comprehensively and accurately based on the findings for the correct anatomy.`,
});

const generateBasicReportFlow = ai.defineFlow(
  {
    name: 'generateBasicReportFlow',
    inputSchema: GenerateBasicReportInputSchema,
    outputSchema: GenerateBasicReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
