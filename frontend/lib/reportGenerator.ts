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
  chartData?: any[];
  predictionData?: any[];
  chatHistory?: Array<{ question: string; answer: string }>;
  stockChanges?: Array<{ date: string; change: number }>;
  newsArticles?: Array<{ title: string; summary: string; provider: string }>;
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

/**
 * PDF Report
 */
async function generatePdfReport(reportData: ReportData): Promise<Buffer> {
  const doc = new jsPDF();

  // Title page
  doc.setFontSize(20);
  doc.text('Investment Performance Report', 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
  doc.text(`Period: ${reportData.period}`, 14, 40);

  // Charts
  if (reportData.includeCharts && reportData.chartData?.length) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Historical Charts', 14, 22);
    doc.setFontSize(12);
    doc.text('Chart images/data would be displayed here', 14, 32);
    // Optional: convert actual charts from canvas to image and add
    // doc.addImage(chartBase64, 'PNG', x, y, width, height);
  }

  // Predictions
  if (reportData.includePredictions && reportData.predictionData?.length) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('AI Predictions', 14, 22);

    const tableData = reportData.predictionData.map((item: any) => [
      item.date,
      item.prediction,
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Prediction']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
  }

  // Stock Changes
  if (reportData.stockChanges?.length) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Stock Changes', 14, 22);

    const tableData = reportData.stockChanges.map((item) => [
      item.date,
      `${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%`,
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Change']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
    });
  }

  // Chat History
  if (reportData.includeChats && reportData.chatHistory?.length) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Chat History', 14, 22);
    let y = 32;
    reportData.chatHistory.forEach((chat, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${idx + 1}: ${chat.question}`, 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(chat.answer, 180);
      doc.text(lines, 16, y);
      y += lines.length * 7 + 4;
    });
  }

  // News
  if (reportData.newsArticles?.length) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Latest News', 14, 22);
    let y = 32;
    reportData.newsArticles.forEach((news, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${news.title} - ${news.provider}`, 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(news.summary, 180);
      doc.text(lines, 16, y);
      y += lines.length * 7 + 4;
    });
  }

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Excel Report
 */
async function generateExcelReport(reportData: ReportData): Promise<Buffer> {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Report Generated', new Date().toLocaleString()],
    ['Period', reportData.period],
    ['Include Charts', reportData.includeCharts ? 'Yes' : 'No'],
    ['Include Predictions', reportData.includePredictions ? 'Yes' : 'No'],
    ['Include Chat History', reportData.includeChats ? 'Yes' : 'No'],
    ['Include News', reportData.newsArticles?.length ? 'Yes' : 'No'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Stock Changes Sheet
  if (reportData.stockChanges?.length) {
    const stockData = [
      ['Date', 'Change (%)'],
      ...reportData.stockChanges.map((s) => [s.date, s.change]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stockData), 'Stock Changes');
  }

  // Predictions Sheet
  if (reportData.predictionData?.length) {
    const predData = [
      ['Date', 'Prediction'],
      ...reportData.predictionData.map((p) => [p.date, p.prediction]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(predData), 'Predictions');
  }

  // Chat History Sheet
  if (reportData.includeChats && reportData.chatHistory?.length) {
    const chatData = [
      ['#', 'Question', 'Answer'],
      ...reportData.chatHistory.map((c, idx) => [idx + 1, c.question, c.answer]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chatData), 'Chat History');
  }

  // News Sheet
  if (reportData.newsArticles?.length) {
    const newsData = [
      ['#', 'Title', 'Summary', 'Provider'],
      ...reportData.newsArticles.map((n, idx) => [idx + 1, n.title, n.summary, n.provider]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(newsData), 'News');
  }

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Word Report
 */
async function generateWordReport(reportData: ReportData): Promise<Buffer> {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer } = docx;

  const children = [
    new Paragraph({ text: 'Investment Performance Report', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}` }),
    new Paragraph({ text: `Period: ${reportData.period}` }),
  ];

  // Stock changes
  if (reportData.stockChanges?.length) {
    children.push(new Paragraph({ text: 'Stock Changes', heading: HeadingLevel.HEADING_2 }));
    reportData.stockChanges.forEach((s) => {
      children.push(new Paragraph(`${s.date}: ${s.change > 0 ? '+' : ''}${s.change}%`));
    });
  }

  // Predictions
  if (reportData.predictionData?.length) {
    children.push(new Paragraph({ text: 'AI Predictions', heading: HeadingLevel.HEADING_2 }));
    reportData.predictionData.forEach((p) => {
      children.push(new Paragraph(`${p.date}: ${p.prediction}`));
    });
  }

  // Chat
  if (reportData.includeChats && reportData.chatHistory?.length) {
    children.push(new Paragraph({ text: 'Chat History', heading: HeadingLevel.HEADING_2 }));
    reportData.chatHistory.forEach((c, idx) => {
      children.push(new Paragraph({ text: `Q${idx + 1}: ${c.question}`}));
      children.push(new Paragraph({ text: `A: ${c.answer}` }));
    });
  }

  // News
  if (reportData.newsArticles?.length) {
    children.push(new Paragraph({ text: 'Latest News', heading: HeadingLevel.HEADING_2 }));
    reportData.newsArticles.forEach((n, idx) => {
      children.push(new Paragraph({ text: `${idx + 1}. ${n.title} - ${n.provider}`}));
      children.push(new Paragraph({ text: n.summary }));
    });
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * PowerPoint Report
 */
async function generatePptReport(reportData: ReportData): Promise<Buffer> {
  const pptx = new PptxGenJS.default();

  // Title Slide
  let slide = pptx.addSlide();
  slide.addText('Investment Performance Report', { x: 1, y: 1, fontSize: 24, bold: true });
  slide.addText(`Generated on: ${new Date().toLocaleString()}\nPeriod: ${reportData.period}`, { x: 1, y: 2, fontSize: 14 });

  // Stock Changes
  if (reportData.stockChanges?.length) {
    slide = pptx.addSlide();
    slide.addText('Stock Changes', { x: 0.5, y: 0.5, fontSize: 18, bold: true });
    reportData.stockChanges.forEach((s, idx) => {
      slide.addText(`${s.date}: ${s.change > 0 ? '+' : ''}${s.change}%`, { x: 0.5, y: 1 + idx * 0.3, fontSize: 12 });
    });
  }

  // Predictions
  if (reportData.predictionData?.length) {
    slide = pptx.addSlide();
    slide.addText('AI Predictions', { x: 0.5, y: 0.5, fontSize: 18, bold: true });
    reportData.predictionData.forEach((p, idx) => {
      slide.addText(`${p.date}: ${p.prediction}`, { x: 0.5, y: 1 + idx * 0.3, fontSize: 12 });
    });
  }

  // Chat History
  if (reportData.includeChats && reportData.chatHistory?.length) {
    slide = pptx.addSlide();
    slide.addText('Chat History', { x: 0.5, y: 0.5, fontSize: 18, bold: true });
    reportData.chatHistory.forEach((c, idx) => {
      slide.addText(`Q${idx + 1}: ${c.question}`, { x: 0.5, y: 1 + idx * 0.6, fontSize: 12, bold: true });
      slide.addText(`A: ${c.answer}`, { x: 0.7, y: 1.2 + idx * 0.6, fontSize: 12 });
    });
  }

  // News
  if (reportData.newsArticles?.length) {
    slide = pptx.addSlide();
    slide.addText('Latest News', { x: 0.5, y: 0.5, fontSize: 18, bold: true });
    reportData.newsArticles.forEach((n, idx) => {
      slide.addText(`${idx + 1}. ${n.title} - ${n.provider}`, { x: 0.5, y: 1 + idx * 0.6, fontSize: 12, bold: true });
      slide.addText(n.summary, { x: 0.7, y: 1.2 + idx * 0.6, fontSize: 12 });
    });
  }

  return pptx.stream() as unknown as Buffer;
}
