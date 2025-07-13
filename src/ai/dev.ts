import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-medical-image.ts';
import '@/ai/flows/explain-diagnosis.ts';
import '@/ai/flows/detect-anomalies.ts';
import '@/ai/flows/correlate-symptoms.ts';
import '@/ai/flows/generate-basic-report.ts';
