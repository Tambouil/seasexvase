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
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}