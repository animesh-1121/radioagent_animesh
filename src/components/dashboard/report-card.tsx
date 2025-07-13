
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { AnalysisResult } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2, Sparkles, User, Stethoscope as StethoscopeIcon } from 'lucide-react';
import { generateBasicReportAction } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import type { ExplanationMap } from './explanation-card';
import jsPDF from 'jspdf';

// Function to extract a filename from the report
const getPdfFilename = (markdown: string, patientName?: string): string => {
    const findingMatch = markdown.match(/^\*   \*\*Finding:\*\* \[([^\]]+)\]/m);
    if (findingMatch && findingMatch[1]) {
        const title = findingMatch[1].replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
        return `RadioAgent_Report_${title}.pdf`;
    }

    if (patientName && patientName.trim() !== '') {
        const safePatientName = patientName.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
        return `RadioAgent_Report_${safePatientName}.pdf`;
    }

    return 'RadioAgent_Detailed_Report.pdf';
};


interface ReportCardProps {
  imageDataUris?: string[] | null;
  analysisResult?: AnalysisResult | null;
  isLoading?: boolean;
  explanations: ExplanationMap;
}

export function ReportCard({ imageDataUris, analysisResult, isLoading, explanations }: ReportCardProps) {
  const [patientInfo, setPatientInfo] = useState({
    patientName: '',
    patientId: '',
    dateOfBirth: '',
    gender: '',
    referringPhysician: '',
    hospital: '',
    scanDate: new Date().toISOString().split('T')[0],
    modality: 'Chest X-Ray (PA View)',
    clinicalHistory: '',
  });
  const [basicReport, setBasicReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateAndSetBasicReport = async () => {
      if (analysisResult) {
        setIsGenerating(true);
        setBasicReport(null);
        const result = await generateBasicReportAction(analysisResult);
        if (result.success) {
          setBasicReport(result.data.markdownReport);
        } else {
          toast({
            variant: 'destructive',
            title: 'Basic Report Failed',
            description: result.error,
          });
        }
        setIsGenerating(false);
      } else {
        setBasicReport(null);
      }
    };
    generateAndSetBasicReport();
  }, [analysisResult, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setPatientInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleDownloadPdf = async (reportMarkdown: string) => {
    setIsDownloading(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - (margin * 2);
    let yPos = margin;
    const LINE_HEIGHT_MULTIPLIER = 1.5;

    // --- PDF HELPER FUNCTIONS ---
    const checkPageBreak = (spaceNeeded: number) => {
        if (yPos + spaceNeeded > pdfHeight - margin) {
            pdf.addPage();
            yPos = margin;
        }
    };
    
    const addWrappedText = (text: string, options: { isBold?: boolean, isItalic?: boolean, indent?: number, isListItem?: boolean, fontSize?: number, isHeading?: boolean } = {}) => {
        const { isBold = false, isItalic = false, indent = 0, isListItem = false, fontSize = 10, isHeading = false } = options;
        
        pdf.setFontSize(fontSize);
        const fontStyle = isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';
        pdf.setFont('helvetica', fontStyle);
        
        let effectiveIndent = margin + indent;
        if (isListItem) {
            checkPageBreak(fontSize * 0.35 * LINE_HEIGHT_MULTIPLIER);
            pdf.text('•', effectiveIndent, yPos);
            effectiveIndent += 5;
        }

        const lines = pdf.splitTextToSize(text, contentWidth - indent - (isListItem ? 5 : 0));
        
        lines.forEach((line: string) => {
           checkPageBreak(fontSize * 0.35 * LINE_HEIGHT_MULTIPLIER + 4); 
           pdf.text(line, effectiveIndent, yPos);
           yPos += (fontSize * 0.35 * LINE_HEIGHT_MULTIPLIER) + 4; // Line height - increased spacing
        });

        yPos += 2;
    };

    const addSectionTitle = (title: string) => {
      checkPageBreak(25);
      yPos += 10; 
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, margin, yPos);
      yPos += 8;
      pdf.setDrawColor(220, 220, 220); 
      pdf.line(margin, yPos, pdfWidth - margin, yPos);
      yPos += 10;
    };

    // --- START BUILDING PDF ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(33, 150, 243); 
    pdf.text('RadioAgent Diagnostic Report', pdfWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Patient Info
    addSectionTitle('Patient Information');
    const infoTable = [
        ['Patient Name:', patientInfo.patientName || 'N/A'],
        ['Patient ID:', patientInfo.patientId || 'N/A'],
        ['Date of Birth:', patientInfo.dateOfBirth || 'N/A'],
        ['Gender:', patientInfo.gender || 'N/A'],
        ['Referring Physician:', patientInfo.referringPhysician || 'N/A'],
        ['Hospital / Unit:', patientInfo.hospital || 'N/A'],
        ['Scan Date:', patientInfo.scanDate || 'N/A'],
        ['Modality:', patientInfo.modality || 'N/A'],
    ];
    
    pdf.setFontSize(10);
    infoTable.forEach(([key, value]) => {
        checkPageBreak(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(key, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 50, yPos);
        yPos += 8;
    })
    yPos += 5;

    addSectionTitle('Clinical History');
    addWrappedText(patientInfo.clinicalHistory || 'Not Provided', { isItalic: true });
    yPos += 5;

    const imageUrisToProcess = (imageDataUris || []).filter(uri => uri.startsWith('data:image'));
    if (imageUrisToProcess.length > 0) {
      addSectionTitle('Key Images');
      for (const [index, uri] of imageUrisToProcess.entries()) {
        const explanationImageUri = explanations[uri]?.explanation?.explanationImage;
        const imgHeight = 60; 
        const imgWidth = 80;
        const combinedHeight = imgHeight + 15;
        checkPageBreak(combinedHeight + 20);
        
        yPos += 5;
        addWrappedText(`File ${index + 1}`, {isBold: true, fontSize: 12});

        const startY = yPos;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Original Scan`, margin, startY);
        pdf.addImage(uri, 'PNG', margin, startY + 2, imgWidth, imgHeight);

        if (explanationImageUri) {
          pdf.text(`AI Explanation`, margin + imgWidth + 10, startY);
          pdf.addImage(explanationImageUri, 'PNG', margin + imgWidth + 10, startY + 2, imgWidth, imgHeight);
        }
        yPos += imgHeight + 15;
      }
    }
    
    // Detailed Report from Markdown
    const reportLines = reportMarkdown.split('\n');
    let skipSection = false;
    let reportStarted = false;

    for(const line of reportLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Logic to skip Patient Info/History sections from markdown
      const lowerTrimmedLine = trimmedLine.toLowerCase();
       if (lowerTrimmedLine.includes('patient information') || lowerTrimmedLine.includes('clinical history')) {
        skipSection = true;
        continue;
      }
      if (skipSection && trimmedLine.startsWith('---')) {
        skipSection = false;
        continue;
      }
      if (skipSection) continue;
      
      if (!reportStarted) {
         if (trimmedLine.startsWith('## ')) {
             reportStarted = true;
         } else {
             continue;
         }
      }
      
      if (trimmedLine.startsWith('## ')) {
          addSectionTitle(trimmedLine.substring(3).replace(/📌|🔍|⚠️/g, '').replace(/\*\*/g, '').trim());
      } else if (trimmedLine.startsWith('### ')) {
          checkPageBreak(15);
          yPos += 8;
          addWrappedText(trimmedLine.substring(4).replace(/🫁|❤️|🌬️|🦴/g, '').replace(/\*\*/g, '').trim(), { isBold: true, fontSize: 12, isHeading: true });
          yPos += 6;
      } else if (trimmedLine.startsWith('*   **')) {
          const match = trimmedLine.match(/\*\s+\*\*(.*?):\*\*\s*(.*)/);
          if (match) {
              const key = match[1].trim();
              let value = match[2].trim().replace(/\[|\]/g, '');
              const isBoldValue = /\*\*(.*?)\*\*/.test(value);
              value = value.replace(/\*\*(.*?)\*\*/g, '$1');
              
              checkPageBreak(12);
              yPos += 4;
              
              const keyY = yPos;
              const valueIndent = 40;
              const valueX = margin + valueIndent;
              
              const FONT_SIZE = 10;
              const LINE_HEIGHT = FONT_SIZE * 0.35 * 1.8; // Increased line height

              const keyLines = pdf.splitTextToSize(`${key}: `, valueIndent - 5);
              const valueLines = pdf.splitTextToSize(value, contentWidth - valueIndent);
              
              // Draw Key (bold)
              pdf.setFontSize(FONT_SIZE);
              pdf.setFont('helvetica', 'bold');
              pdf.text(keyLines, margin, yPos);
              
              // Draw Value
              pdf.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
              pdf.text(valueLines, valueX, keyY);

              const keyHeight = keyLines.length * LINE_HEIGHT;
              const valueHeight = valueLines.length * LINE_HEIGHT;

              yPos += Math.max(keyHeight, valueHeight) + 4; // Use the max height of the key or value to increment yPos
          }
      } else if (trimmedLine.startsWith('* ')) {
           const textWithoutBullet = trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '$1');
           addWrappedText(textWithoutBullet, { isListItem: true, indent: 5 });
      } else if (trimmedLine.startsWith('> ')) {
          yPos += 4;
          addWrappedText(trimmedLine.substring(2).replace(/\*\*(.*?)\*\*/g, '$1'), { isItalic: true, indent: 5 });
      } else if (trimmedLine !== '---' && !trimmedLine.startsWith('#')) {
          addWrappedText(trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1'));
      }
    };

    const filename = getPdfFilename(reportMarkdown, patientInfo.patientName);
    pdf.save(filename);
    setIsDownloading(false);
  };

  const handleGenerateAndDownload = async () => {
    if (!basicReport) return;
    
    setIsDialogOpen(false); 
    toast({
        title: "Generating PDF...",
        description: "Your report is being prepared for download.",
    });
    // Use a small timeout to allow the dialog to close before the heavy PDF work starts
    setTimeout(() => {
        handleDownloadPdf(basicReport);
    }, 100);
  };

  const isActionDisabled = isLoading || isGenerating || !analysisResult || !basicReport || isDownloading;

  return (
    <Card className="flex flex-col w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>AI Diagnostic Report</span>
        </CardTitle>
        <CardDescription>Initial AI-generated analysis based on the image series.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
        {(isGenerating && !basicReport) || isLoading ? (
          <div className="w-full space-y-4 py-4">
             <Skeleton className="h-6 w-1/2" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-24 w-full" />
          </div>
        ) : basicReport ? (
          <div className="prose prose-sm dark:prose-invert max-w-none w-full border rounded-md p-4 bg-secondary/30">
             <ReactMarkdown>{basicReport}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Upload an image to generate a report.</p>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={isActionDisabled}>
               {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
               Download Report (PDF)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enter Patient Information for Report</DialogTitle>
              <DialogDescription>
                This information will be added to the PDF report. All fields are optional but recommended.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="patientName">Patient Name</Label><Input id="patientName" value={patientInfo.patientName} onChange={handleInputChange} placeholder="John Doe" disabled={isDownloading} /></div>
                <div><Label htmlFor="patientId">Patient ID</Label><Input id="patientId" value={patientInfo.patientId} onChange={handleInputChange} placeholder="PID-12345" disabled={isDownloading} /></div>
                <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" type="date" value={patientInfo.dateOfBirth} onChange={handleInputChange} disabled={isDownloading} /></div>
                <div><Label htmlFor="gender">Gender</Label><Input id="gender" value={patientInfo.gender} onChange={handleInputChange} placeholder="Male" disabled={isDownloading} /></div>
                <div><Label htmlFor="referringPhysician">Referring Physician</Label><Input id="referringPhysician" value={patientInfo.referringPhysician} onChange={handleInputChange} placeholder="Dr. Smith" disabled={isDownloading} /></div>
                <div><Label htmlFor="hospital">Hospital / Unit</Label><Input id="hospital" value={patientInfo.hospital} onChange={handleInputChange} placeholder="City General Hospital" disabled={isDownloading} /></div>
                <div><Label htmlFor="scanDate">Scan Date</Label><Input id="scanDate" type="date" value={patientInfo.scanDate} onChange={handleInputChange} disabled={isDownloading} /></div>
                <div><Label htmlFor="modality">Modality</Label><Input id="modality" value={patientInfo.modality} onChange={handleInputChange} placeholder="e.g., Chest X-Ray" disabled={isDownloading} /></div>
              </div>

              <h3 className="font-semibold text-lg flex items-center gap-2 pt-4"><StethoscopeIcon className="w-5 h-5 text-primary" /> Clinical Details</h3>
              <div>
                <Label htmlFor="clinicalHistory">Clinical History</Label>
                <Textarea id="clinicalHistory" placeholder="e.g., 45-year-old male, non-smoker, history of pneumonia..." value={patientInfo.clinicalHistory} onChange={handleInputChange} className="mt-2" rows={3} disabled={isDownloading} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isDownloading}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleGenerateAndDownload} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate & Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
