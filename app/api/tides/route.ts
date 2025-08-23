import { NextRequest, NextResponse } from 'next/server';

interface TideEvent {
  time: string;
  height: number;
  type: 'high' | 'low';
}

export async function GET(request: NextRequest) {
  try {
    // Get date range for API call (current date + 7 days)
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    
    const fromDate = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const toDate = endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    // Fetch real tide data from Rochefort API
    const credentials = Buffer.from('public_rochefort_website:7131356a95e9521c03d74b5e70a96476').toString('base64');
    
    const response = await fetch(
      `https://www.rochefort-ocean.com/api/content/tides/rochefort?fromDate=${fromDate}&endDate=${toDate}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
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
      data.data.forEach((dayData: any) => {
        const baseDate = new Date(dayData.date);
        
        // PM matin (Pleine mer matin)
        if (dayData.pm_matin) {
          const [hours, minutes] = dayData.pm_matin.split(':');
          const pmMatinDate = new Date(baseDate);
          pmMatinDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          tideEvents.push({
            time: pmMatinDate.toISOString(),
            height: parseFloat(dayData.pm_matin_haut),
            type: 'high',
          });
        }
        
        // PM soir (Pleine mer soir)
        if (dayData.pm_soir) {
          const [hours, minutes] = dayData.pm_soir.split(':');
          const pmSoirDate = new Date(baseDate);
          pmSoirDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          tideEvents.push({
            time: pmSoirDate.toISOString(),
            height: parseFloat(dayData.pm_soir_haut),
            type: 'high',
          });
        }
        
        // BM matin (Basse mer matin)
        if (dayData.bm_matin) {
          const [hours, minutes] = dayData.bm_matin.split(':');
          const bmMatinDate = new Date(baseDate);
          bmMatinDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          tideEvents.push({
            time: bmMatinDate.toISOString(),
            height: parseFloat(dayData.bm_matin_haut),
            type: 'low',
          });
        }
        
        // BM soir (Basse mer soir)
        if (dayData.bm_soir) {
          const [hours, minutes] = dayData.bm_soir.split(':');
          const bmSoirDate = new Date(baseDate);
          bmSoirDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          tideEvents.push({
            time: bmSoirDate.toISOString(),
            height: parseFloat(dayData.bm_soir_haut),
            type: 'low',
          });
        }
      });
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