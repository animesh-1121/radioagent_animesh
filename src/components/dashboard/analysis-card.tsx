'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileScan, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '@/app/actions';

interface AnalysisCardProps {
  result?: AnalysisResult | null;
  isLoading?: boolean;
}

export function AnalysisCard({ result, isLoading }: AnalysisCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileScan className="w-5 h-5 text-primary" />
          <span>Initial Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : result ? (
          <>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Key Findings</h3>
              <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{result.findings || 'No significant findings.'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Detected Anomalies</h3>
              {result.anomalies && result.anomalies.toLowerCase() !== 'none' && result.anomalies.toLowerCase() !== 'no anomalies detected' ? (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{result.anomalies}</span>
                </div>
              ) : (
                <Badge variant="secondary">None Detected</Badge>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Analysis results will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}
