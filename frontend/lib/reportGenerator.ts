import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import PptxGenJS from 'pptxgenjs';

export interface ReportData {
  format: 'pdf' | 'excel' | 'word' | 'ppt';
  period: 'daily' | 'weekly' | 'monthly';
  includeCharts: boolean;
  includeChats: boolean;
  includePredictions: boolean;
  chartData: any[];
  predictionData: any[];
  chatHistory: Array<{ question: string; answer: string }>;
  stockChanges: Array<{ date: string; change: number }>;
  generatedAt: string;
}

export async function createReport(reportData: ReportData): Promise<Buffer> {
  switch (reportData.format) {
    case 'pdf':
      return generatePdfReport(reportData);
    case 'excel':
      return generateExcelReport(reportData);
    case 'word':
      return generateWordReport(reportData);
    case 'ppt':
      return generatePptReport(reportData);
    default:
      throw new Error(`Unsupported report format: ${reportData.format}`);
  }
}

// ================= PDF REPORT =================
async function generatePdfReport(data: ReportData): Promise<Buffer> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Investment Performance Report', 14, 22);

  // Metadata
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
  doc.text(`Period: ${data.period}`, 14, 40);

  // Historical Charts
  if (data.includeCharts && data.chartData.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Historical Performance', 14, 22);
    doc.setFontSize(12);
    doc.text('Charts would be displayed here', 14, 32);
  }

  // AI Predictions / Stock Changes
  if (data.includePredictions && data.predictionData.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('AI Predictions', 14, 22);

    const tableData = data.stockChanges.map((item) => [
      item.date,
      item.change > 0 ? `+${item.change.toFixed(2)}%` : `${item.change.toFixed(2)}%`,
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Price Change']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // Chat History
  if (data.includeChats && data.chatHistory.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Chat History', 14, 22);

    let yPos = 40;
    data.chatHistory.forEach((chat, index) => {
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

// ================= EXCEL REPORT =================
async function generateExcelReport(data: ReportData): Promise<Buffer> {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Report Information', ''],
    ['Generated On', new Date().toLocaleString()],
    ['Report Period', data.period],
    ['', ''],
    ['Sections Included', ''],
    ['Historical Charts', data.includeCharts ? 'Yes' : 'No'],
    ['AI Predictions', data.includePredictions ? 'Yes' : 'No'],
    ['Chat History', data.includeChats ? 'Yes' : 'No'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Stock Changes
  if (data.stockChanges.length > 0) {
    const stockSheet = [
      ['Date', 'Price Change (%)'],
      ...data.stockChanges.map((item) => [item.date, item.change]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stockSheet), 'Stock Changes');
  }

  // Chat History
  if (data.includeChats && data.chatHistory.length > 0) {
    const chatSheet = [
      ['#', 'Question', 'Answer'],
      ...data.chatHistory.map((chat, index) => [index + 1, chat.question, chat.answer]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chatSheet), 'Chat History');
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// ================= WORD REPORT =================
async function generateWordReport(data: ReportData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Investment Performance Report',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}`, spacing: { after: 100 } }),
          new Paragraph({ text: `Period: ${data.period}`, spacing: { after: 200 } }),
        ],
      },
    ],
  });

  // Add Sections
  if (data.includeCharts && data.chartData.length > 0) {
    doc.addSection({
      children: [
        new Paragraph({ text: 'Historical Charts', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: 'Charts would be displayed here.' }),
      ],
    });
  }

  if (data.includePredictions && data.predictionData.length > 0) {
    doc.addSection({
      children: [
        new Paragraph({ text: 'AI Predictions / Stock Changes', heading: HeadingLevel.HEADING_2 }),
        ...data.stockChanges.map((item, index) =>
          new Paragraph({ text: `${index + 1}. ${item.date}: ${item.change > 0 ? '+' : ''}${item.change}%` })
        ),
      ],
    });
  }

  if (data.includeChats && data.chatHistory.length > 0) {
    doc.addSection({
      children: [
        new Paragraph({ text: 'Chat History', heading: HeadingLevel.HEADING_2 }),
        ...data.chatHistory.map((chat, index) =>
          new Paragraph({ text: `Q${index + 1}: ${chat.question}\nA: ${chat.answer}` })
        ),
      ],
    });
  }

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ================= PPT REPORT =================
async function generatePptReport(data: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Title Slide
  const slide1 = pptx.addSlide();
  slide1.addText('Investment Performance Report', { x: 1, y: 1, w: 8, h: 1, fontSize: 24, bold: true });
  slide1.addText(`Generated: ${new Date().toLocaleString()}\nPeriod: ${data.period}`, { x: 1, y: 2, w: 8, h: 1, fontSize: 14 });

  // Charts Slide
  if (data.includeCharts && data.chartData.length > 0) {
    const slide = pptx.addSlide();
    slide.addText('Historical Charts', { x: 1, y: 1, fontSize: 18, bold: true });
    slide.addText('Charts would be displayed here.', { x: 1, y: 1.5, fontSize: 12 });
  }

  // Predictions Slide
  if (data.includePredictions && data.predictionData.length > 0) {
    const slide = pptx.addSlide();
    slide.addText('AI Predictions / Stock Changes', { x: 1, y: 1, fontSize: 18, bold: true });
    data.stockChanges.forEach((item, index) => {
      slide.addText(`${index + 1}. ${item.date}: ${item.change > 0 ? '+' : ''}${item.change}%`, { x: 1, y: 1.5 + index * 0.3, fontSize: 12 });
    });
  }

  // Chat Slide
  if (data.includeChats && data.chatHistory.length > 0) {
    const slide = pptx.addSlide();
    slide.addText('Chat History', { x: 1, y: 1, fontSize: 18, bold: true });
    data.chatHistory.forEach((chat, index) => {
      slide.addText(`Q${index + 1}: ${chat.question}`, { x: 1, y: 1.5 + index * 0.5, fontSize: 12, bold: true });
      slide.addText(`A: ${chat.answer}`, { x: 1.2, y: 1.7 + index * 0.5, fontSize: 12 });
    });
  }

  const buffer = await pptx.stream();
  return buffer as unknown as Buffer;
}
