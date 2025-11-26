// frontend/pages/api/generate-report.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createReport } from '../../lib/reportGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const reportData = req.body;

    // Generate the report using the library
    const reportBuffer = await createReport(reportData);

    // Determine filename based on format and period
    const format = reportData.format || 'pdf';
    const period = reportData.period || 'daily';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `financial-report-${period}-${timestamp}.${format}`;

    // Set proper headers for file download
    let contentType = 'application/octet-stream';
    switch (format) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'word':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'ppt':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(reportBuffer);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error instanceof Error ? error.message : String(error) });
  }
}
