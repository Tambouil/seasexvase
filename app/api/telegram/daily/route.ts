import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface Session {
  date: string;
  timeStart: string;
  timeEnd: string;
  windSpeed: number;
  windDirection: string;
  tideHeight: number;
  score: number;
  conditions: string;
}

export async function POST() {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Telegram configuration missing');
    }

    // Get session analysis
    const analysisResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/session-analysis`
    );
    const analysisData = await analysisResponse.json();

    const { tomorrowBest, bestSessions, analysis } = analysisData;

    let message = '🌊 **VaseGuru au 🫡** 🌊\n\n';

    if (tomorrowBest && tomorrowBest.score >= 80) {
      message += `✅ **EXCELLENTE SESSION DEMAIN !**\n`;
      message += `📅 ${tomorrowBest.date}\n`;
      message += `⏰ ${tomorrowBest.timeStart} - ${tomorrowBest.timeEnd}\n`;
      message += `💨 Vent: ${tomorrowBest.windSpeed} kts ${tomorrowBest.windDirection}\n`;
      message += `🌊 Marée: ${tomorrowBest.tideHeight.toFixed(1)}m\n`;
      message += `⭐ Score: ${tomorrowBest.score}/100\n`;
      message += `📝 ${tomorrowBest.conditions}\n\n`;
    } else if (tomorrowBest && tomorrowBest.score >= 60) {
      message += `⚠️ **Session correcte demain**\n`;
      message += `📅 ${tomorrowBest.date}\n`;
      message += `⏰ ${tomorrowBest.timeStart} - ${tomorrowBest.timeEnd}\n`;
      message += `💨 Vent: ${tomorrowBest.windSpeed} kts ${tomorrowBest.windDirection}\n`;
      message += `🌊 Marée: ${tomorrowBest.tideHeight.toFixed(1)}m\n`;
      message += `⭐ Score: ${tomorrowBest.score}/100\n\n`;
    } else if (tomorrowBest) {
      message += `🟠 **Session possible demain (conditions moyennes)**\n`;
      message += `📅 ${tomorrowBest.date}\n`;
      message += `⏰ ${tomorrowBest.timeStart} - ${tomorrowBest.timeEnd}\n`;
      message += `💨 Vent: ${tomorrowBest.windSpeed} kts ${tomorrowBest.windDirection}\n`;
      message += `🌊 Marée: ${tomorrowBest.tideHeight.toFixed(1)}m\n`;
      message += `⭐ Score: ${tomorrowBest.score}/100\n\n`;
    } else {
      message += `❌ **Pas de session recommandée demain**\n`;
      message += `Les conditions ne sont pas favorables.\n\n`;
    }

    // Add next best sessions
    if (bestSessions.length > 0) {
      message += `🎯 **Meilleures sessions à venir:**\n`;
      bestSessions.slice(0, 3).forEach((session: Session, index: number) => {
        message += `${index + 1}. ${session.date} ${session.timeStart} - ${session.windSpeed}kts ${
          session.windDirection
        } - ${session.tideHeight.toFixed(1)}m (${session.score}pts)\n`;
      });
      message += '\n';
    } else if (!tomorrowBest) {
      message += `📊 **Aucune session prévue sur les 3 prochains jours**\n\n`;
    }

    // Add summary
    message += `📊 **Résumé 3 prochains jours:**\n`;
    message += `🟢 Sessions excellentes: ${analysis.excellentSessions}\n`;
    message += `🟡 Sessions correctes: ${analysis.goodSessions}\n`;
    message += `🟠 Sessions moyennes: ${analysis.averageSessions}\n\n`;

    message += `📱 [Consulte l'app pour plus de détails !](https://presquilewind.vercel.app/)\n`;

    // Send Telegram message
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      throw new Error(`Telegram API error: ${errorData.description}`);
    }

    const telegramData = await telegramResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      telegramResponse: telegramData,
      sessionAnalysis: {
        tomorrowBest,
        bestSessionsCount: bestSessions.length,
        analysis,
      },
    });
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test endpoint to manually trigger notification
  return POST();
}
