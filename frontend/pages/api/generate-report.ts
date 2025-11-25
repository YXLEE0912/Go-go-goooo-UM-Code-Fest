// frontend/pages/api/generate-report.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createReport } from '../../lib/reportGenerator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const reportData = req.body;
    const reportBuffer = await createReport(reportData);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.send(reportBuffer);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
}