'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadCard } from './image-upload-card';
import { AnalysisCard } from './analysis-card';
import { ReportCard } from './report-card';
import { ExplanationCard, type ExplanationMap } from './explanation-card';
import { AssistantCard } from './assistant-card';
import { SymptomCorrelatorCard } from './symptom-correlator-card';
import { performAnalysisAction } from '@/app/actions';

export function DashboardClient() {
  const [imageDataUris, setImageDataUris] = useState<string[] | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [explanations, setExplanations] = useState<ExplanationMap>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setImageDataUris(null);
    setAnalysisResult(null);
    setExplanations({});
    setIsAnalyzing(false);
  };

  const handleAnalysis = async (dataUris: string[]) => {
    // We call resetState here to clear any previous analysis results
    // before starting a new one.
    setAnalysisResult(null);
    setExplanations({});
    setImageDataUris(dataUris);
    setIsAnalyzing(true);
    
    const result = await performAnalysisAction(dataUris);

    if (result.success) {
      setAnalysisResult(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: result.error,
      });
      setImageDataUris(null);
    }
    setIsAnalyzing(false);
  };

  const showResults = isAnalyzing || analysisResult;

  return (
    <div className="container mx-auto max-w-7xl py-4 sm:py-6 md:py-8">
      <div className="grid grid-cols-1 gap-6">
        {!showResults && (
            <ImageUploadCard
            onAnalyze={handleAnalysis}
            isAnalyzing={isAnalyzing}
            onClear={resetState}
            />
        )}

        {showResults && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnalysisCard isLoading={isAnalyzing} result={analysisResult} />
                    <ExplanationCard 
                      isLoading={isAnalyzing} 
                      imageDataUris={imageDataUris} 
                      analysisResult={analysisResult}
                      explanations={explanations}
                      setExplanations={setExplanations}
                    />
                </div>
                <ReportCard 
                  isLoading={isAnalyzing} 
                  imageDataUris={imageDataUris}
                  analysisResult={analysisResult}
                  explanations={explanations}
                />
            </>
        )}
        
        {analysisResult && (
          <>
            <SymptomCorrelatorCard analysisResult={analysisResult} />
            <AssistantCard analysisResult={analysisResult} />
          </>
        )}
      </div>
    </div>
  );
}
