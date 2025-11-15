import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Test endpoint to verify Sentry error capture
 * This endpoint should only be used in development/staging
 */
export async function GET(request: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    // Test different types of errors
    const testType = request.nextUrl.searchParams.get('type') || 'error';

    switch (testType) {
      case 'error':
        throw new Error('Test error for Sentry monitoring');
      
      case 'warning':
        Sentry.captureMessage('Test warning message', 'warning');
        return NextResponse.json({ message: 'Warning sent to Sentry' });
      
      case 'info':
        Sentry.captureMessage('Test info message', 'info');
        return NextResponse.json({ message: 'Info sent to Sentry' });
      
      default:
        return NextResponse.json({ 
          message: 'Use ?type=error|warning|info to test different Sentry captures' 
        });
    }
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);
    
    return NextResponse.json(
      { 
        message: 'Error captured by Sentry',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
