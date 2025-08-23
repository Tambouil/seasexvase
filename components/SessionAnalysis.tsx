interface SessionWindow {
  date: string;
  timeStart: string;
  timeEnd: string;
  windSpeed: number;
  windDirection: string;
  tideHeight: number;
  score: number;
  conditions: string;
}

interface AnalysisData {
  allSessions: SessionWindow[];
  bestSessions: SessionWindow[];
  tomorrowBest: SessionWindow | null;
  analysis: {
    totalWindows: number;
    excellentSessions: number;
    goodSessions: number;
    averageSessions: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 border-green-300 text-green-800';
  if (score >= 60) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 border-orange-300 text-orange-800';
  return 'bg-red-100 border-red-300 text-red-800';
}

function getScoreIcon(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

async function getSessionAnalysis(): Promise<AnalysisData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000';
    
    const url = `${baseUrl}/api/session-analysis`;
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch session analysis: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching session analysis:', error);
    return null;
  }
}

export async function SessionAnalysis() {
  const data = await getSessionAnalysis();

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-red-600">Erreur lors de l&apos;analyse des sessions</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-700 text-white p-4">
        <h2 className="text-xl font-bold">🎯 Analyse des Sessions</h2>
        <p className="text-sm text-purple-100 mt-1">Meilleures fenêtres pour naviguer basées sur vent + marée</p>
      </div>

      <div className="p-6">
        {/* Tomorrow's best session */}
        {data.tomorrowBest && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🌅 Session de demain</h3>
            <div className={`p-4 rounded-lg border-2 ${getScoreColor(data.tomorrowBest.score)}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-lg">
                    {getScoreIcon(data.tomorrowBest.score)} {data.tomorrowBest.date}
                  </div>
                  <div className="text-sm">
                    {data.tomorrowBest.timeStart} - {data.tomorrowBest.timeEnd}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">{data.tomorrowBest.score}/100</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>💨 Vent:</strong> {data.tomorrowBest.windSpeed} kts {data.tomorrowBest.windDirection}
                </div>
                <div>
                  <strong>🌊 Marée:</strong> {data.tomorrowBest.tideHeight.toFixed(1)}m
                </div>
              </div>
              <div className="mt-2 text-sm font-medium">📝 {data.tomorrowBest.conditions}</div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.analysis.excellentSessions}</div>
            <div className="text-sm text-green-800">Sessions excellentes</div>
            <div className="text-xs text-gray-600">(≥80 pts)</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{data.analysis.goodSessions}</div>
            <div className="text-sm text-yellow-800">Sessions correctes</div>
            <div className="text-xs text-gray-600">(60-79 pts)</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{data.analysis.averageSessions}</div>
            <div className="text-sm text-orange-800">Sessions moyennes</div>
            <div className="text-xs text-gray-600">(40-59 pts)</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.analysis.totalWindows}</div>
            <div className="text-sm text-blue-800">Total analysé</div>
            <div className="text-xs text-gray-600">créneaux</div>
          </div>
        </div>

        {/* Best sessions list */}
        <div>
          <h3 className="text-lg font-semibold mb-4">🏆 Top Sessions à venir</h3>
          {data.allSessions.length > 0 ? (
            <div className="space-y-3">
              {data.allSessions.slice(0, 8).map((session, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${getScoreColor(session.score)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {getScoreIcon(session.score)} #{index + 1} - {session.date}
                      </div>
                      <div className="text-sm mt-1">
                        ⏰ {session.timeStart} - {session.timeEnd} | 💨 {session.windSpeed}kts {session.windDirection} |
                        🌊 {session.tideHeight.toFixed(1)}m
                      </div>
                      <div className="text-xs mt-1 opacity-80">{session.conditions}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-lg">{session.score}</div>
                      <div className="text-xs">pts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">🌊</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">Aucune session à venir</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex flex-wrap gap-4">
          <div>
            <strong>Critères:</strong> Vent excellent ≥20kts, Vent correct 15-19kts, Vent moyen 12-14kts (navigation
            possible jusqu&apos;à 40kts), Marée ≥2.5m, Direction favorable, Heures de jour
          </div>
        </div>
      </div>
    </div>
  );
}
