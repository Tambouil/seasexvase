'use client';

import { useEffect, useState } from 'react';

interface TideEvent {
  time: string;
  height: number;
  type: 'high' | 'low';
}

interface TideData {
  location: string;
  tideEvents: TideEvent[];
  hourlyHeights: Array<{ time: string; height: number }>;
}

function getTideHeightColor(height: number, type: 'high' | 'low'): string {
  if (type === 'high') {
    // High tide colors - green for higher tides
    if (height >= 5.5) return 'bg-green-200 text-green-900';
    if (height >= 4.5) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  } else {
    // Low tide colors - blue for very low, orange for higher lows
    if (height <= 1.0) return 'bg-blue-200 text-blue-900';
    if (height <= 2.0) return 'bg-blue-100 text-blue-800';
    return 'bg-orange-100 text-orange-800';
  }
}

function formatTideHeight(height: number): string {
  return `${height.toFixed(1)}m`;
}

function formatTideTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatTideDate(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export function TideTable() {
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTides() {
      try {
        const response = await fetch('/api/tides');
        if (!response.ok) {
          throw new Error('Failed to fetch tide data');
        }
        const data = await response.json();
        setTideData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTides();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tideData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-red-600">
          Erreur lors du chargement des marées: {error}
        </div>
      </div>
    );
  }

  // Group tides by day
  const tidesByDay: { [key: string]: TideEvent[] } = {};
  tideData.tideEvents.forEach((tide) => {
    const dateKey = formatTideDate(tide.time);
    if (!tidesByDay[dateKey]) {
      tidesByDay[dateKey] = [];
    }
    tidesByDay[dateKey].push(tide);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-4">
        <h2 className="text-xl font-bold">Marées - {tideData.location}</h2>
        <p className="text-sm text-cyan-100 mt-1">
          Prévisions des coefficients et horaires de marée
        </p>
      </div>

      <div className="p-4">
        {Object.entries(tidesByDay).map(([day, tides]) => (
          <div key={day} className="mb-6 last:mb-0">
            <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
              {day}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tides.map((tide, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${getTideHeightColor(tide.height, tide.type)}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">
                        {tide.type === 'high' ? '🌊 Pleine mer' : '🏖️ Basse mer'}
                      </div>
                      <div className="text-sm opacity-80">
                        {formatTideTime(tide.time)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatTideHeight(tide.height)}
                      </div>
                      <div className="text-xs opacity-70">
                        {tide.type === 'high' ? 'Hauteur max' : 'Hauteur min'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Légende marées:</span>
            <span className="px-2 py-1 bg-green-200 text-green-900 rounded">Grande marée</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Marée moyenne</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Marée faible</span>
          </div>
        </div>
      </div>
    </div>
  );
}