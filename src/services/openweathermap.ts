import env from '../config/env.js';
import redis from '../config/redis.js';

interface WeatherData {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
    city: string;
}

class OpenWeatherMapService {
    private apiKey: string;
    private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
    private cacheTTL = 12 * 60 * 60; // 12 hours in seconds

    constructor() {
        this.apiKey = '99223e1d13569d43c9a822a0075037de'; //'env.openweathermap.apiKey';
    }

    private getCacheKey(latitude: number, longitude: number): string {
        return `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
    }

    async getWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
        try {
            if (!this.apiKey) {
                console.warn('[openweathermap] API key not configured');
                return null;
            }

            // Check cache first
            const cacheKey = this.getCacheKey(latitude, longitude);
            const cachedData = await redis.getJson(cacheKey);
            if (cachedData) {
                console.log('[openweathermap] Returning cached weather data');
                return cachedData;
            }

            // Fetch from API
            const url = `${this.baseUrl}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;
            console.log('Fetching weather from URL:', url);
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[openweathermap] Failed to fetch weather:', response.status, errorText);
                return null;
            }

            const data: any = await response.json();

            const weatherData: WeatherData = {
                temperature: Math.round(data.main.temp),
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind?.speed || 0,
                icon: data.weather[0].icon,
                city: data.name,
            };

            // Cache the result
            await redis.setJson(cacheKey, weatherData, this.cacheTTL);

            return weatherData;
        } catch (error) {
            console.error('[openweathermap] Error fetching weather:', error);
            return null;
        }
    }

    async getWeatherByCity(city: string): Promise<WeatherData | null> {
        try {
            if (!this.apiKey) {
                console.warn('[openweathermap] API key not configured');
                return null;
            }

            const cacheKey = `weather:city:${city.toLowerCase()}`;
            const cachedData = await redis.getJson(cacheKey);
            if (cachedData) {
                console.log('[openweathermap] Returning cached weather data for city');
                return cachedData;
            }

            const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[openweathermap] Failed to fetch weather by city:', response.status, errorText);
                return null;
            }

            const data: any = await response.json();

            const weatherData: WeatherData = {
                temperature: Math.round(data.main.temp),
                description: data.weather[0].description,
                humidity: data.main.humidity,
                windSpeed: data.wind?.speed || 0,
                icon: data.weather[0].icon,
                city: data.name,
            };

            // Cache the result
            await redis.setJson(cacheKey, weatherData, this.cacheTTL);

            return weatherData;
        } catch (error) {
            console.error('[openweathermap] Error fetching weather by city:', error);
            return null;
        }
    }
}

export default new OpenWeatherMapService();
