'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, Loader2, Lightbulb, Activity, TestTube2, UserCheck } from 'lucide-react';
import type { AnalysisResult } from '@/app/actions';
import { correlateSymptomsAction } from '@/app/actions';
import type { CorrelateSymptomsOutput } from '@/ai/flows/correlate-symptoms';
import { Badge } from '@/components/ui/badge';

interface SymptomCorrelatorCardProps {
  analysisResult: AnalysisResult;
}

const getConfidenceColor = (confidence: 'High' | 'Medium' | 'Low') => {
  switch (confidence) {
    case 'High':
      return 'bg-red-500 hover:bg-red-500';
    case 'Medium':
      return 'bg-yellow-500 hover:bg-yellow-500';
    case 'Low':
      return 'bg-green-500 hover:bg-green-500';
  }
};

export function SymptomCorrelatorCard({ analysisResult }: SymptomCorrelatorCardProps) {
  const [symptoms, setSymptoms] = useState('');
  const [correlationResult, setCorrelationResult] = useState<CorrelateSymptomsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCorrelate = async () => {
    if (!symptoms.trim()) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please enter patient symptoms to generate a correlation.',
      });
      return;
    }
    setIsLoading(true);
    setCorrelationResult(null);

    const result = await correlateSymptomsAction({
      symptoms,
      findings: analysisResult.findings,
      anomalies: analysisResult.anomalies,
    });

    if (result.success) {
      setCorrelationResult(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Correlation Failed',
        description: result.error,
      });
    }
    setIsLoading(false);
  };
  
  const getNextStepIcon = (step: string) => {
    const lowerStep = step.toLowerCase();
    if (lowerStep.includes('blood test')) return <TestTube2 className="h-4 w-4 mr-2" />;
    if (lowerStep.includes('consult')) return <UserCheck className="h-4 w-4 mr-2" />;
    if (lowerStep.includes('biopsy') || lowerStep.includes('imaging')) return <Activity className="h-4 w-4 mr-2" />;
    return <Lightbulb className="h-4 w-4 mr-2" />;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span>Symptom & Anomaly Correlator</span>
        </CardTitle>
        <CardDescription>Enter patient symptoms to generate a differential diagnosis based on imaging findings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., persistent cough, fever, shortness of breath"
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleCorrelate} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            Correlate
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center pt-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Correlating symptoms and findings...</p>
          </div>
        )}
        
        {correlationResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Potential Conditions</h3>
              <div className="space-y-3">
                {correlationResult.potentialConditions.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-semibold text-base">{item.condition}</h4>
                       <Badge className={getConfidenceColor(item.confidence)}>
                         {item.confidence} Confidence
                       </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Suggested Next Steps</h3>
              <div className="p-4 rounded-lg border bg-secondary/50">
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {correlationResult.suggestedNextSteps.split(/, | and /).map((step, index) => (
                      step && <li key={index} className="flex items-center">{getNextStepIcon(step)}{step}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
