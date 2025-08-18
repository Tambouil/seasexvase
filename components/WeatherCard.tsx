import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeatherCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function WeatherCard({ 
  title, 
  value, 
  unit, 
  subtitle, 
  icon, 
  className 
}: WeatherCardProps) {
  return (
    <Card className={cn('w-full shadow-weather shadow-weather-hover bg-white rounded-2xl border-0', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold text-gray-900">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-6 w-6 text-indigo-600">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">
          {value}{unit && <span className="text-lg font-medium text-muted-foreground ml-2">{unit}</span>}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground mt-3">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}