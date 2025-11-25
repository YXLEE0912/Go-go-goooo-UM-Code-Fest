// frontend/lib/reportGenerator.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as docx from 'docx';
import * as PptxGenJS from 'pptxgenjs';

interface ReportData {
  format: 'pdf' | 'excel' | 'word' | 'ppt';
  period: 'daily' | 'weekly' | 'monthly';
  includeCharts: boolean;
  includeChats: boolean;
  includePredictions: boolean;
  chartData: any;
  predictionData: any;
  chatHistory: Array<{ question: string; answer: string }>;
  stockChanges: Array<{ date: string; change: number }>;
  generatedAt: string;
}

export async function createReport(reportData: ReportData): Promise<Buffer> {
  switch (reportData.format) {
    case 'pdf':
      return await generatePdfReport(reportData);
    case 'excel':
      return await generateExcelReport(reportData);
    case 'word':
      return await generateWordReport(reportData);
    case 'ppt':
      return await generatePptReport(reportData);
    default:
      throw new Error(`Unsupported report format: ${reportData.format}`);
  }
}

async function generatePdfReport(reportData: ReportData): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Investment Performance Report', 14, 22);
  
  // Add report metadata
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
  doc.text(`Period: ${reportData.period}`, 14, 40);
  
  // Add charts section if enabled
  if (reportData.includeCharts && reportData.chartData) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Historical Performance', 14, 22);
    
    // Here you would add the actual chart image
    // For now, we'll add a placeholder
    doc.setFontSize(12);
    doc.text('Historical chart would be displayed here', 14, 40);
  }
  
  // Add predictions section if enabled
  if (reportData.includePredictions && reportData.predictionData) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('AI Predictions', 14, 22);
    
    // Add prediction data as a table
    const tableData = reportData.stockChanges.map(item => [
      item.date,
      `${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%`
    ]);
    
    (doc as any).autoTable({
      head: [['Date', 'Price Change']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  // Add chat history if enabled
  if (reportData.includeChats && reportData.chatHistory.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Chat History', 14, 22);
    
    let yPos = 40;
    reportData.chatHistory.forEach((chat, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${index + 1}: ${chat.question}`, 14, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const answerLines = doc.splitTextToSize(chat.answer, 180);
      doc.text(answerLines, 20, yPos);
      yPos += answerLines.length * 7 + 10;
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

async function generateExcelReport(reportData: ReportData): Promise<Buffer> {
  const wb = XLSX.utils.book_new();
  
  // Create summary sheet
  const summaryData = [
    ['Report Information', ''],
    ['Generated On', new Date().toLocaleString()],
    ['Report Period', reportData.period],
    ['', ''],
    ['Sections Included', ''],
    ['Historical Charts', reportData.includeCharts ? 'Yes' : 'No'],
    ['AI Predictions', reportData.includePredictions ? 'Yes' : 'No'],
    ['Chat History', reportData.includeChats ? 'Yes' : 'No']
  ];
  
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryData),
    'Summary'
  );
  
  // Add stock changes sheet
  if (reportData.stockChanges.length > 0) {
    const stockData = [
      ['Date', 'Price Change (%)'],
      ...reportData.stockChanges.map(item => [
        item.date,
        { t: 'n', v: item.change, z: '0.00%' }
      ])
    ];
    
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(stockData),
      'Stock Changes'
    );
  }
  
  // Add chat history sheet if enabled
  if (reportData.includeChats && reportData.chatHistory.length > 0) {
    const chatData = [
      ['#', 'Question', 'Answer'],
      ...reportData.chatHistory.map((chat, index) => [
        index + 1,
        chat.question,
        chat.answer
      ])
    ];
    
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(chatData),
      'Chat History'
    );
  }
  
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

async function generateWordReport(reportData: ReportData): Promise<Buffer> {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer } = docx;
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Investment Performance Report",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleString()}`,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Period: ${reportData.period}`,
          spacing: { after: 200 }
        }),
        
        // Add more sections based on reportData
        // This is a simplified version - you'd want to add more sections
        // for charts, predictions, and chat history similar to the PDF version
      ]
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

async function generatePptReport(reportData: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS.default();
  const slide = pptx.addSlide();
  
  // Title slide
  slide.addText('Investment Performance Report', {
    x: 1,
    y: 1,
    w: 8,
    h: 1,
    fontSize: 24,
    bold: true
  });
  
  slide.addText(`Generated on: ${new Date().toLocaleString()}\nPeriod: ${reportData.period}`, {
    x: 1,
    y: 2,
    w: 8,
    h: 1,
    fontSize: 14
  });
  
  // Add more slides based on reportData
  // This is a simplified version - you'd want to add more slides
  // for charts, predictions, and chat history
  
  return pptx.stream() as unknown as Buffer;
}