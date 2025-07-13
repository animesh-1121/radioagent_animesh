'use server';

import { ai } from '@/ai/genkit';
import { analyzeMedicalImage } from '@/ai/flows/analyze-medical-image';
import { detectAnomalies } from '@/ai/flows/detect-anomalies';
import { explainDiagnosis } from '@/ai/flows/explain-diagnosis';
import type { ExplainDiagnosisInput, ExplainDiagnosisOutput } from '@/ai/flows/explain-diagnosis';
import { correlateSymptoms } from '@/ai/flows/correlate-symptoms';
import type { CorrelateSymptomsInput, CorrelateSymptomsOutput } from '@/ai/flows/correlate-symptoms';
import { generateBasicReport } from '@/ai/flows/generate-basic-report';
import { type GenerateBasicReportOutput, type GenerateBasicReportInput } from '@/app/types';

export type AnalysisResult = {
  findings: string;
  anomalies: string;
};

export async function performAnalysisAction(
  imageDataUris: string[]
): Promise<{ success: true, data: AnalysisResult } | { success: false, error: string }> {
  if (imageDataUris.length === 0) {
    return { success: false, error: 'No images provided for analysis.' };
  }
  try {
    const [analysis, anomaliesResult] = await Promise.all([
      analyzeMedicalImage({ photoDataUris: imageDataUris }),
      // Pass only the first image to anomaly detection for now to avoid overwhelming it,
      // as the main analysis will synthesize findings from all images.
      detectAnomalies({ photoDataUri: imageDataUris[0] }),
    ]);

    return {
      success: true,
      data: {
        findings: analysis.findings,
        anomalies: anomaliesResult.anomalies,
      },
    };
  } catch (error) {
    console.error('Error in performAnalysisAction:', error);
    return { success: false, error: 'An error occurred during image analysis.' };
  }
}

export async function generateBasicReportAction(
  input: GenerateBasicReportInput
): Promise<{ success: true, data: GenerateBasicReportOutput } | { success: false, error: string }> {
  try {
    const report = await generateBasicReport(input);
    return { success: true, data: report };
  } catch (error) {
    console.error('Error in generateBasicReportAction:', error);
    return { success: false, error: 'An error occurred while generating the basic report.' };
  }
}

export async function explainDiagnosisAction(
  input: ExplainDiagnosisInput
): Promise<{ success: true, data: ExplainDiagnosisOutput } | { success: false, error: string }> {
  try {
    const explanation = await explainDiagnosis(input);
    return { success: true, data: explanation };
  } catch (error) {
    console.error('Error in explainDiagnosisAction:', error);
    return { success: false, error: 'An error occurred while generating the explanation.' };
  }
}

export async function getConversationalResponse(
  context: string,
  question: string
): Promise<{ success: true, data: string } | { success: false, error: string }> {
  try {
    const response = await ai.generate({
      prompt: `You are an expert radiologist with years of experience interpreting medical scans. You are speaking with another healthcare professional who has questions about the analysis.
      Provide clear, concise, and clinically relevant answers based on the provided context. Use professional medical terminology where appropriate. Do not repeat the context or the question in your answer.
      
      Context: "${context}"
      
      Question: "${question}"`,
    });
    return { success: true, data: response.text };
  } catch (error) {
    console.error('Error in getConversationalResponse:', error);
    return { success: false, error: 'An error occurred while getting a response.' };
  }
}

export async function correlateSymptomsAction(
  input: CorrelateSymptomsInput
): Promise<{ success: true, data: CorrelateSymptomsOutput } | { success: false, error: string }> {
  try {
    const result = await correlateSymptoms(input);
    return { success: true, data: result };
  } catch (error)
{
    console.error('Error in correlateSymptomsAction:', error);
    return { success: false, error: 'An error occurred during symptom correlation.' };
  }
}
