interface WindRoseProps {
  direction: number;
  speed: number;
  speedUnit: string;
}

export function WindRose({ direction, speed, speedUnit }: WindRoseProps) {
  const cardinalPoints = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SO', angle: 225 },
    { label: 'O', angle: 270 },
    { label: 'NO', angle: 315 },
  ];

  const intermediatePoints = [
    { label: 'NNE', angle: 22.5 },
    { label: 'ENE', angle: 67.5 },
    { label: 'ESE', angle: 112.5 },
    { label: 'SSE', angle: 157.5 },
    { label: 'SSO', angle: 202.5 },
    { label: 'OSO', angle: 247.5 },
    { label: 'ONO', angle: 292.5 },
    { label: 'NNO', angle: 337.5 },
  ];

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Cercles concentriques */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" className="text-gray-200" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" className="text-gray-200" strokeWidth="1" />
        <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" className="text-gray-200" strokeWidth="1" />

        {/* Lignes des points cardinaux */}
        {cardinalPoints.map((point) => {
          const radians = (point.angle * Math.PI) / 180;
          const x1 = 100 + Math.sin(radians) * 30;
          const y1 = 100 - Math.cos(radians) * 30;
          const x2 = 100 + Math.sin(radians) * 90;
          const y2 = 100 - Math.cos(radians) * 90;

          return (
            <line
              key={point.label}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              className="text-gray-300"
              strokeWidth="1"
            />
          );
        })}

        {/* Flèche de direction du vent */}
        <g transform={`rotate(${direction} 100 100)`}>
          {/* Tige de la flèche */}
          <line x1="100" y1="100" x2="100" y2="25" stroke="currentColor" className="text-red-600" strokeWidth="3" />
          {/* Pointe de la flèche */}
          <polygon points="100,15 90,35 110,35" fill="currentColor" className="text-red-600" />
          {/* Queue de la flèche (d'où vient le vent) */}
          <polygon points="100,175 95,165 105,165" fill="currentColor" className="text-red-500" />
        </g>
      </svg>

      {/* Points cardinaux principaux */}
      {cardinalPoints.map((point) => {
        const radians = (point.angle * Math.PI) / 180;
        const x = 50 + Math.sin(radians) * 52;
        const y = 50 - Math.cos(radians) * 52;

        return (
          <div
            key={point.label}
            className="absolute font-bold text-sm"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {point.label}
          </div>
        );
      })}

      {/* Points intermédiaires */}
      {intermediatePoints.map((point) => {
        const radians = (point.angle * Math.PI) / 180;
        const x = 50 + Math.sin(radians) * 52;
        const y = 50 - Math.cos(radians) * 52;

        return (
          <div
            key={point.label}
            className="absolute text-xs text-white/70 font-medium"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {point.label}
          </div>
        );
      })}

      {/* Valeur centrale */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold">{speed.toFixed(1)}</div>
        <div className="text-xs text-gray-200">{speedUnit}</div>
      </div>
    </div>
  );
}
