import { WeatherApp } from '@/components/WeatherApp';
import { WindguruTable } from '@/components/WindguruTable';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 space-y-8">
        <WeatherApp />

        <WindguruTable />
      </div>
    </div>
  );
}
