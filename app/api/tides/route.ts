import { NextResponse } from 'next/server';

interface TideEvent {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export async function GET() {
  try {
    // Get date range for API call (current date + 7 days)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    const fromDate = now
      .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-');
    const toDate = endDate
      .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-');

    // Fetch real tide data from Rochefort API
    const credentials = Buffer.from('public_rochefort_website:7131356a95e9521c03d74b5e70a96476').toString('base64');

    const response = await fetch(
      `https://www.rochefort-ocean.com/api/content/tides/rochefort?fromDate=${fromDate}&endDate=${toDate}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Rochefort API failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse tide events from Rochefort API response
    const tideEvents: TideEvent[] = [];

    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach(
        (dayData: {
          date: string;
          pm_matin: string;
          pm_matin_haut: string;
          pm_soir: string;
          pm_soir_haut: string;
          bm_matin: string;
          bm_matin_haut: string;
          bm_soir: string;
          bm_soir_haut: string;
        }) => {
          const baseDate = new Date(dayData.date);

          // Helper function to create date in Europe/Paris timezone
          const createParisDate = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':');
            const dateStr = dayData.date + 'T' + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':00';
            // Create date assuming it's in Europe/Paris timezone
            const utcDate = new Date(dateStr + '+02:00'); // Summer time (CEST)
            return utcDate;
          };

          // PM matin (Pleine mer matin)
          if (dayData.pm_matin) {
            tideEvents.push({
              time: createParisDate(dayData.pm_matin).toISOString(),
              height: parseFloat(dayData.pm_matin_haut),
              type: 'high',
            });
          }

          // PM soir (Pleine mer soir)
          if (dayData.pm_soir) {
            tideEvents.push({
              time: createParisDate(dayData.pm_soir).toISOString(),
              height: parseFloat(dayData.pm_soir_haut),
              type: 'high',
            });
          }

          // BM matin (Basse mer matin)
          if (dayData.bm_matin) {
            tideEvents.push({
              time: createParisDate(dayData.bm_matin).toISOString(),
              height: parseFloat(dayData.bm_matin_haut),
              type: 'low',
            });
          }

          // BM soir (Basse mer soir)
          if (dayData.bm_soir) {
            tideEvents.push({
              time: createParisDate(dayData.bm_soir).toISOString(),
              height: parseFloat(dayData.bm_soir_haut),
              type: 'low',
            });
          }
        }
      );
    }

    // Sort by time
    tideEvents.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return NextResponse.json({
      location: 'Rochefort/Fouras',
      tideEvents,
      hourlyHeights: [], // Not provided by this API
      debug: {
        message: 'Real tide data from Rochefort API',
        eventsCount: tideEvents.length,
        dateRange: `${fromDate} to ${toDate}`,
      },
    });
  } catch (error) {
    console.error('Error fetching tide data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch tide data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
