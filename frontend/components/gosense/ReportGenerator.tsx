// frontend/components/gosense/ReportGenerator.tsx
"use client"

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type ReportType = 'pdf' | 'excel' | 'word' | 'ppt';
type ReportPeriod = 'daily' | 'weekly' | 'monthly';

interface ReportGeneratorProps {
  chartData: any[];
  predictionData: any[];
  chatHistory: Array<{ question: string; answer: string }>;
  stockChanges: Array<{ date: string; change: number }>;
}

export function ReportGenerator({
  chartData,
  predictionData,
  chatHistory,
  stockChanges,
}: ReportGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ReportType>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeChats, setIncludeChats] = useState(true);
  const [includePredictions, setIncludePredictions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const reportData = {
        format: selectedFormat,
        period: selectedPeriod,
        includeCharts,
        includeChats,
        includePredictions,
        chartData: includeCharts ? chartData : null,
        predictionData: includePredictions ? predictionData : null,
        chatHistory: includeChats ? chatHistory : [],
        stockChanges: stockChanges || [],
        generatedAt: new Date().toISOString(),
      };

      console.log('Sending report data:', reportData);

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate report';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Generated report is empty');
      }
      
      // Get filename from content-disposition header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `report-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      // Close dialog on success
      setOpen(false);
      
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-4" onClick={() => setOpen(true)}>
          Generate Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Custom Report</DialogTitle>
        </DialogHeader>

        {/* Error Display - Added this section */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            <strong>Error: </strong>{error}
          </div>
        )}

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="format">Report Format</TabsTrigger>
            <TabsTrigger value="content">Content Options</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pdf', 'excel', 'word', 'ppt'] as ReportType[]).map((format) => (
                    <Button
                      key={format}
                      variant={selectedFormat === format ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat(format)}
                      className="capitalize"
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Report Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod(period)}
                      className="capitalize"
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeCharts"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includeCharts" className="text-sm font-medium">
                  Include Historical Charts
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePredictions"
                  checked={includePredictions}
                  onChange={(e) => setIncludePredictions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includePredictions" className="text-sm font-medium">
                  Include AI Predictions
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeChats"
                  checked={includeChats}
                  onChange={(e) => setIncludeChats(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includeChats" className="text-sm font-medium">
                  Include Chat History
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}