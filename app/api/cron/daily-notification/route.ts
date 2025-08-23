import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger the Telegram notification
    const notificationResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
          : 'http://localhost:3000'
      }/api/telegram/daily`,
      {
        method: 'POST',
      }
    );

    if (!notificationResponse.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await notificationResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Daily notification sent successfully',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
