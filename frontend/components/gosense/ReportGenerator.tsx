"use client";

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// Use the same API base URL as the rest of the app
const API_BASE_URL = "http://localhost:8000";

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
  const [open, setOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeChats, setIncludeChats] = useState(true);
  const [includePredictions, setIncludePredictions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const reportData = {
        format: 'pdf',
        period: selectedPeriod,
        includeCharts,
        includeChats,
        includePredictions,
        chartData: includeCharts ? chartData : [],
        predictionData: includePredictions ? predictionData : [],
        chatHistory: includeChats ? chatHistory : [],
        stockChanges: stockChanges || [],
        generatedAt: new Date().toISOString(), // Required by backend
      };

      // Call the backend API directly (not the Next.js API route)
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        // Try to parse error response (FastAPI returns {detail: "message"})
        let errorMessage = 'Failed to generate report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Generated report is empty');

      // Determine filename dynamically based on selected format
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `report.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-6 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Generate Custom Report</DialogTitle>
        </DialogHeader>

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
              <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-white">
                <p className="text-sm font-medium mb-1">Report format</p>
                <p className="text-sm text-white/80">
                  Reports are generated in high-quality PDF format with standardized sections.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white">Report Period</label>
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
                <label htmlFor="includeCharts" className="text-sm font-medium text-white">
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
                <label htmlFor="includePredictions" className="text-sm font-medium text-white">
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
                <label htmlFor="includeChats" className="text-sm font-medium text-white">
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
