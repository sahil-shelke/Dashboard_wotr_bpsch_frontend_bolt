import axios from 'axios';
import { Cloud, CloudRain, Thermometer, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WeatherData {
  DateIssue: string;
  DateForecast: string;
  Rainfall: number;
  RhMax: number;
  RhMin: number;
  TempMax: number;
  TempMin: number;
  WindSpeed: number;
  BlockCode: string;
}

function WeatherForecast() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/weather_forecast');
      setWeatherData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load weather data');
      console.error('Error fetching weather data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayWeather = () => {
    return weatherData.find((w) => w.DateIssue === w.DateForecast);
  };

  const getForecastWeather = () => {
    return weatherData.filter((w) => w.DateIssue !== w.DateForecast);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const todayWeather = getTodayWeather();
  const forecastWeather = getForecastWeather();

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 max-w-[calc(100vw-2rem)] max-h-[500px] overflow-hidden border border-gray-200">
          <div className="bg-[#0F4C44] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Cloud className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Weather Forecast</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-[#0D3F39] rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[420px]">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800] mx-auto"></div>
                <p className="mt-2">Loading weather data...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayWeather && (
                  <div className="p-4 bg-[#F5F9F8]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-[#0F4C44]">
                        Current Weather
                      </h4>
                      <span className="text-xs bg-[#FFB800] text-[#0F4C44] px-2 py-1 rounded-full font-medium">
                        {formatDate(todayWeather.DateForecast)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <CloudRain className="w-4 h-4 text-[#0F4C44] mt-1" />
                        <div>
                          <p className="text-xs text-gray-600">Rainfall</p>
                          <p className="text-sm font-semibold text-[#0F4C44]">
                            {todayWeather.Rainfall} mm
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Thermometer className="w-4 h-4 text-red-500 mt-1" />
                        <div>
                          <p className="text-xs text-gray-600">Temp Max</p>
                          <p className="text-sm font-semibold text-[#0F4C44]">
                            {todayWeather.TempMax}°C
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Thermometer className="w-4 h-4 text-blue-500 mt-1" />
                        <div>
                          <p className="text-xs text-gray-600">Temp Min</p>
                          <p className="text-sm font-semibold text-[#0F4C44]">
                            {todayWeather.TempMin}°C
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {forecastWeather.length > 0 && (
                  <div className="p-4">
                    <h4 className="font-semibold text-[#0F4C44] mb-3">
                      Upcoming Forecast
                    </h4>
                    <div className="space-y-3">
                      {forecastWeather.map((weather, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 hover:bg-[#F5F9F8] transition-colors border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#0F4C44]">
                              {formatDate(weather.DateForecast)}
                            </span>
                            <div className="flex items-center gap-1 text-[#0F4C44]">
                              <CloudRain className="w-3 h-3" />
                              <span className="text-xs">{weather.Rainfall} mm</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-red-500" />
                              <span className="text-gray-600">
                                Max: {weather.TempMax}°C
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-blue-500" />
                              <span className="text-gray-600">
                                Min: {weather.TempMin}°C
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#FFB800] text-[#0F4C44] rounded-full p-4 shadow-lg hover:shadow-xl hover:bg-[#E5A600] transition-all hover:scale-105"
        >
          <Cloud className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

export default WeatherForecast;
