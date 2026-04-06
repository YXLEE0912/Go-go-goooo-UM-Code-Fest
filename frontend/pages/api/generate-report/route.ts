// frontend/pages/api/generate-report/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Use environment variable or default to localhost:8000
const BACKEND_URL = process.env.BACKEND_URL || 'https://go-go-goooo-um-code-fest-2gfn.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxying report generation request to backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      let errorMessage = 'Failed to generate report';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        errorMessage = `Backend error: ${response.status}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Get the file blob from backend
    const blob = await response.blob();
    const headers = new Headers();
    
    // Copy relevant headers from backend response
    const contentDisposition = response.headers.get('content-disposition');
    const contentType = response.headers.get('content-type');
    
    if (contentDisposition) {
      headers.set('content-disposition', contentDisposition);
    } else {
      // Fallback filename
      headers.set('content-disposition', 'attachment; filename="report.pdf"');
    }
    
    if (contentType) {
      headers.set('content-type', contentType);
    }

    // Return the file directly
    return new Response(blob, { 
      status: 200,
      headers 
    });
    
  } catch (error) {
    console.error('Error in generate-report proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error - Cannot connect to backend' },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Report generation API is working',
    backend: BACKEND_URL 
  });
}