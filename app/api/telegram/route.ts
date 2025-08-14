import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function GET() {
  return handleTelegramAlert();
}

export async function POST() {
  return handleTelegramAlert();
}

async function handleTelegramAlert() {
  try {
    if (!TELEGRAM_BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Récupérer les données météo
    const weatherResponse = await fetch('https://www.meteolarochelle.fr/wdlchatel/clientraw.txt');
    const weatherData = await weatherResponse.text();
    const values = weatherData.split(' ');
    
    const windSpeedKnots = parseFloat(values[1] || '0');
    const windDirection = parseFloat(values[3] || '0');
    const temperature = parseFloat(values[4] || '0');
    
    console.log(`Current wind: ${windSpeedKnots} knots`);
    
    // Vérifier si le vent est > 5 nœuds
    if (windSpeedKnots <= 5) {
      return NextResponse.json({ 
        message: 'Wind too low', 
        windSpeed: windSpeedKnots 
      });
    }
    
    // Préparer le message Telegram
    const message = `🌬️ *Vent favorable détecté !*
    
📍 Châtelaillon-Plage
💨 ${windSpeedKnots} nœuds
🧭 ${windDirection}°
🌡️ ${temperature}°C

⛵ Conditions parfaites pour naviguer !`;

    // Envoyer le message via Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
    });
    
    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      throw new Error(`Telegram API error: ${error}`);
    }
    
    const result = await telegramResponse.json();
    
    return NextResponse.json({
      message: 'Telegram alert sent',
      windSpeed: windSpeedKnots,
      windDirection: windDirection,
      temperature: temperature,
      telegramResult: result
    });
    
  } catch (error) {
    console.error('Error in telegram alert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}