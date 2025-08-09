"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherRecommendations = exports.getWeatherAlerts = exports.getWeatherForecast = exports.getCurrentWeather = void 0;
/**
 * Get current weather for default or specified location
 * GET /api/v1/weather/current
 * Query params: location (optional), coordinates (optional)
 */
const getCurrentWeather = async (req, res) => {
    try {
        const { location, lat, lng } = req.query;
        console.log('🌤️ [Weather] Getting current weather', { location, lat, lng });
        // Default location: Antalya (main SUP location)
        const weatherLocation = {
            id: location?.toString() || 'antalya',
            name: location?.toString() || 'Antalya',
            coordinates: {
                lat: parseFloat(lat?.toString() || '36.8969'),
                lng: parseFloat(lng?.toString() || '30.7133')
            },
            timezone: 'Europe/Istanbul'
        };
        // In production, this would integrate with OpenWeatherMap, WeatherAPI, or similar service
        const currentWeather = await generateCurrentWeatherData(weatherLocation);
        res.status(200).json({
            success: true,
            data: {
                weather: currentWeather,
                location: weatherLocation,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching current weather:', error);
        res.status(500).json({
            success: false,
            error: 'Hava durumu verileri alınamadı'
        });
    }
};
exports.getCurrentWeather = getCurrentWeather;
/**
 * Get weather forecast for the next 7 days
 * GET /api/v1/weather/forecast
 * Query params: location, days (optional, default 7)
 */
const getWeatherForecast = async (req, res) => {
    try {
        const { location, days = 7, lat, lng } = req.query;
        console.log('📅 [Weather] Getting weather forecast', { location, days, lat, lng });
        const weatherLocation = {
            id: location?.toString() || 'antalya',
            name: location?.toString() || 'Antalya',
            coordinates: {
                lat: parseFloat(lat?.toString() || '36.8969'),
                lng: parseFloat(lng?.toString() || '30.7133')
            },
            timezone: 'Europe/Istanbul'
        };
        const forecastDays = Math.min(parseInt(days.toString()) || 7, 14); // Max 14 days
        const forecast = await generateWeatherForecast(weatherLocation, forecastDays);
        res.status(200).json({
            success: true,
            data: {
                location: weatherLocation,
                forecast: forecast,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching weather forecast:', error);
        res.status(500).json({
            success: false,
            error: 'Hava durumu tahmini alınamadı'
        });
    }
};
exports.getWeatherForecast = getWeatherForecast;
/**
 * Get active weather alerts for SUP activities
 * GET /api/v1/weather/alerts
 * Query params: location (optional), severity (optional)
 */
const getWeatherAlerts = async (req, res) => {
    try {
        const { location, severity } = req.query;
        console.log('⚠️ [Weather] Getting weather alerts', { location, severity });
        // Get alerts from Firestore or generate sample alerts
        const alerts = await getActiveWeatherAlerts(location?.toString(), severity?.toString());
        res.status(200).json({
            success: true,
            data: {
                alerts: alerts,
                alertCount: alerts.length,
                activeAlerts: alerts.filter(alert => alert.isActive).length,
                highSeverityAlerts: alerts.filter(alert => alert.severity === 'high' || alert.severity === 'extreme').length,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching weather alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Hava durumu uyarıları alınamadı'
        });
    }
};
exports.getWeatherAlerts = getWeatherAlerts;
/**
 * Get SUP activity recommendations based on weather
 * GET /api/v1/weather/recommendations
 * Query params: location, date (optional), experience_level (optional)
 */
const getWeatherRecommendations = async (req, res) => {
    try {
        const { location, date, experience_level } = req.query;
        console.log('🏄‍♂️ [Weather] Getting SUP recommendations', {
            location,
            date,
            experience_level,
            userId: req.user?.uid
        });
        const weatherLocation = {
            id: location?.toString() || 'antalya',
            name: location?.toString() || 'Antalya',
            coordinates: {
                lat: 36.8969,
                lng: 30.7133
            },
            timezone: 'Europe/Istanbul'
        };
        const targetDate = date ? new Date(date.toString()) : new Date();
        const experienceLevel = experience_level?.toString() || 'beginner';
        const recommendations = await generateSUPRecommendations(weatherLocation, targetDate, experienceLevel);
        res.status(200).json({
            success: true,
            data: {
                location: weatherLocation,
                date: targetDate.toISOString(),
                experienceLevel: experienceLevel,
                recommendations: recommendations,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating weather recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Hava durumu önerileri oluşturulamadı'
        });
    }
};
exports.getWeatherRecommendations = getWeatherRecommendations;
// Helper functions for generating weather data
async function generateCurrentWeatherData(location) {
    // In production, integrate with real weather API (OpenWeatherMap, etc.)
    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour < 20;
    // Generate realistic weather data based on time and location
    const baseTemp = 22; // Base temperature for Mediterranean climate
    const tempVariation = Math.sin((hour - 6) / 12 * Math.PI) * 8; // Daily temperature curve
    const temperature = Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 4);
    const windSpeed = Math.round(8 + Math.random() * 12); // 8-20 km/h typical range
    const waveHeight = Math.round((windSpeed / 10) * 10) / 10; // Wave height based on wind
    const condition = isDay ?
        (Math.random() > 0.8 ? 'cloudy' : Math.random() > 0.9 ? 'rainy' : 'sunny') :
        (Math.random() > 0.9 ? 'cloudy' : 'clear');
    // Calculate SUP suitability
    const isSuitableForSUP = windSpeed <= 20 && !['stormy', 'rainy'].includes(condition);
    let recommendation;
    if (windSpeed <= 10 && (condition === 'sunny' || condition === 'clear')) {
        recommendation = 'excellent';
    }
    else if (windSpeed <= 15 && !['rainy', 'stormy'].includes(condition)) {
        recommendation = 'good';
    }
    else if (windSpeed <= 20 && !['stormy'].includes(condition)) {
        recommendation = 'fair';
    }
    else {
        recommendation = 'poor';
    }
    return {
        temperature,
        windSpeed,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        waveHeight,
        visibility: Math.round(8 + Math.random() * 4), // 8-12 km
        condition,
        uvIndex: isDay ? Math.round(3 + Math.random() * 7) : 0,
        humidity: Math.round(50 + Math.random() * 30), // 50-80%
        pressure: Math.round(1010 + Math.random() * 20), // 1010-1030 hPa
        isSuitableForSUP,
        recommendation
    };
}
async function generateWeatherForecast(location, days) {
    const hourlyForecast = [];
    const dailyForecast = [];
    // Generate hourly forecast for next 48 hours
    for (let i = 0; i < 48; i++) {
        const forecastTime = new Date();
        forecastTime.setHours(forecastTime.getHours() + i);
        const hour = forecastTime.getHours();
        const isDay = hour >= 6 && hour < 20;
        const baseTemp = 22;
        const tempVariation = Math.sin((hour - 6) / 12 * Math.PI) * 8;
        const temperature = Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 2);
        const windSpeed = Math.round(6 + Math.random() * 14);
        const condition = isDay ?
            (Math.random() > 0.7 ? 'cloudy' : Math.random() > 0.8 ? 'rainy' : 'sunny') :
            (Math.random() > 0.8 ? 'cloudy' : 'clear');
        hourlyForecast.push({
            time: forecastTime.toISOString(),
            temperature,
            windSpeed,
            windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            condition,
            waveHeight: Math.round((windSpeed / 10) * 10) / 10,
            isSuitableForSUP: windSpeed <= 18 && !['stormy', 'rainy'].includes(condition)
        });
    }
    // Generate daily forecast
    for (let i = 0; i < days; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);
        const minTemp = Math.round(18 + Math.random() * 6);
        const maxTemp = minTemp + Math.round(8 + Math.random() * 8);
        const windSpeed = Math.round(8 + Math.random() * 10);
        const chanceOfRain = Math.round(Math.random() * 30);
        let recommendation;
        if (windSpeed <= 10 && chanceOfRain <= 10) {
            recommendation = 'excellent';
        }
        else if (windSpeed <= 15 && chanceOfRain <= 20) {
            recommendation = 'good';
        }
        else if (windSpeed <= 20 && chanceOfRain <= 40) {
            recommendation = 'fair';
        }
        else {
            recommendation = 'poor';
        }
        const bestTimeSlots = recommendation === 'excellent' || recommendation === 'good' ?
            ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] :
            recommendation === 'fair' ? ['10:00', '11:00', '15:00'] : [];
        dailyForecast.push({
            date: forecastDate.toISOString().split('T')[0],
            minTemp,
            maxTemp,
            condition: chanceOfRain > 50 ? 'rainy' : windSpeed > 15 ? 'cloudy' : 'sunny',
            windSpeed,
            chanceOfRain,
            recommendation,
            bestTimeSlots
        });
    }
    return { hourly: hourlyForecast, daily: dailyForecast };
}
async function getActiveWeatherAlerts(location, severity) {
    // In production, fetch from weather services and Firestore
    const sampleAlerts = [];
    // Generate sample alerts based on current conditions
    const now = new Date();
    const shouldHaveWindAlert = Math.random() > 0.7; // 30% chance of wind alert
    const shouldHaveStormAlert = Math.random() > 0.9; // 10% chance of storm alert
    if (shouldHaveWindAlert) {
        sampleAlerts.push({
            id: `wind_alert_${Date.now()}`,
            type: 'wind',
            severity: 'medium',
            title: 'Güçlü Rüzgar Uyarısı',
            message: 'Bugün öğleden sonra rüzgar hızının 25 km/h\'ye kadar çıkması bekleniyor. SUP aktiviteleri için dikkatli olunması önerilir.',
            startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
            endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), // +8 hours
            affectedLocations: ['Antalya', 'Kaş', 'Kemer'],
            recommendations: [
                'Deneyimli kullanıcılar için uygun',
                'Başlangıç seviyesi için önerilmez',
                'Güvenlik ekipmanlarını kontrol edin',
                'Kıyıya yakın kalmaya özen gösterin'
            ],
            isActive: true
        });
    }
    if (shouldHaveStormAlert) {
        sampleAlerts.push({
            id: `storm_alert_${Date.now()}`,
            type: 'storm',
            severity: 'high',
            title: 'Fırtına Uyarısı',
            message: 'Yarın akşam saatlerinde şiddetli rüzgar ve yağmur bekleniyor. Tüm su sporları aktiviteleri iptal edilmelidir.',
            startTime: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), // +18 hours
            endTime: new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString(), // +30 hours
            affectedLocations: ['Antalya', 'Kaş', 'Kemer', 'Side'],
            recommendations: [
                'Tüm su sporları aktiviteleri iptal edilmelidir',
                'Rezervasyonları erteleme seçeneği sunun',
                'Müşterileri bilgilendirin',
                'Ekipmanları güvenli yere kaldırın'
            ],
            isActive: true
        });
    }
    // Filter by severity if specified
    if (severity && ['low', 'medium', 'high', 'extreme'].includes(severity)) {
        return sampleAlerts.filter(alert => alert.severity === severity);
    }
    return sampleAlerts;
}
async function generateSUPRecommendations(location, date, experienceLevel) {
    // Get weather data for the specified date
    const weather = await generateCurrentWeatherData(location);
    const factors = [];
    let totalScore = 0;
    const recommendations = [];
    const warnings = [];
    // Wind factor
    let windScore = 0;
    let windImpact = 'neutral';
    if (weather.windSpeed <= 10) {
        windScore = 10;
        windImpact = 'positive';
    }
    else if (weather.windSpeed <= 15) {
        windScore = 7;
        windImpact = 'neutral';
    }
    else if (weather.windSpeed <= 20) {
        windScore = 4;
        windImpact = 'negative';
    }
    else {
        windScore = 1;
        windImpact = 'negative';
        warnings.push('Güçlü rüzgar nedeniyle SUP aktivitesi risklidir');
    }
    factors.push({
        factor: 'Rüzgar Hızı',
        score: windScore,
        impact: windImpact,
        description: `${weather.windSpeed} km/h rüzgar hızı ${windImpact === 'positive' ? 'ideal' : windImpact === 'neutral' ? 'kabul edilebilir' : 'riskli'} koşullar`
    });
    totalScore += windScore;
    // Weather condition factor
    let conditionScore = 0;
    let conditionImpact = 'neutral';
    switch (weather.condition) {
        case 'sunny':
        case 'clear':
            conditionScore = 10;
            conditionImpact = 'positive';
            break;
        case 'cloudy':
            conditionScore = 7;
            conditionImpact = 'neutral';
            break;
        case 'rainy':
            conditionScore = 3;
            conditionImpact = 'negative';
            warnings.push('Yağmurlu hava koşulları görüşü kısıtlayabilir');
            break;
        case 'stormy':
            conditionScore = 1;
            conditionImpact = 'negative';
            warnings.push('Fırtınalı hava nedeniyle SUP aktivitesi yapılmamalıdır');
            break;
        default:
            conditionScore = 5;
    }
    factors.push({
        factor: 'Hava Koşulları',
        score: conditionScore,
        impact: conditionImpact,
        description: `${weather.condition} hava koşulları`
    });
    totalScore += conditionScore;
    // Wave height factor
    let waveScore = 0;
    let waveImpact = 'neutral';
    if (!weather.waveHeight || weather.waveHeight <= 0.5) {
        waveScore = 10;
        waveImpact = 'positive';
    }
    else if (weather.waveHeight <= 1.0) {
        waveScore = 7;
        waveImpact = 'neutral';
    }
    else if (weather.waveHeight <= 1.5) {
        waveScore = 4;
        waveImpact = 'negative';
    }
    else {
        waveScore = 1;
        waveImpact = 'negative';
        warnings.push('Yüksek dalga nedeniyle deneyimli kullanıcılar için bile riskli');
    }
    factors.push({
        factor: 'Dalga Yüksekliği',
        score: waveScore,
        impact: waveImpact,
        description: `${weather.waveHeight || 0.3}m dalga yüksekliği`
    });
    totalScore += waveScore;
    // Visibility factor
    let visibilityScore = 0;
    let visibilityImpact = 'neutral';
    if (weather.visibility >= 8) {
        visibilityScore = 10;
        visibilityImpact = 'positive';
    }
    else if (weather.visibility >= 5) {
        visibilityScore = 7;
        visibilityImpact = 'neutral';
    }
    else if (weather.visibility >= 3) {
        visibilityScore = 4;
        visibilityImpact = 'negative';
    }
    else {
        visibilityScore = 1;
        visibilityImpact = 'negative';
        warnings.push('Düşük görüş mesafesi nedeniyle güvenlik riski var');
    }
    factors.push({
        factor: 'Görüş Mesafesi',
        score: visibilityScore,
        impact: visibilityImpact,
        description: `${weather.visibility}km görüş mesafesi`
    });
    totalScore += visibilityScore;
    // Calculate overall score (out of 40, convert to 10)
    const overallScore = Math.round((totalScore / 40) * 10);
    let overall;
    if (overallScore >= 8) {
        overall = 'excellent';
        recommendations.push('Mükemmel SUP koşulları - tüm deneyim seviyelerine uygun');
    }
    else if (overallScore >= 6) {
        overall = 'good';
        recommendations.push('İyi SUP koşulları - çoğu kullanıcı için uygun');
    }
    else if (overallScore >= 4) {
        overall = 'fair';
        recommendations.push('Ortalama koşullar - deneyimli kullanıcılar için uygun');
        if (experienceLevel === 'beginner') {
            warnings.push('Başlangıç seviyesi için önerilmez');
        }
    }
    else {
        overall = 'poor';
        recommendations.push('Zor koşullar - SUP aktivitesi önerilmez');
        warnings.push('Tüm deneyim seviyeleri için riskli');
    }
    // Generate ideal time slots based on conditions
    const idealTimeSlots = [];
    if (overall === 'excellent' || overall === 'good') {
        idealTimeSlots.push('09:00', '10:00', '11:00', '14:00', '15:00', '16:00');
    }
    else if (overall === 'fair') {
        idealTimeSlots.push('10:00', '11:00', '15:00');
    }
    // Experience-based recommendations
    switch (experienceLevel) {
        case 'beginner':
            if (overall === 'excellent' || overall === 'good') {
                recommendations.push('Başlangıç seviyesi için ideal koşullar');
                recommendations.push('Eğitmen eşliğinde güvenle aktivite yapılabilir');
            }
            break;
        case 'intermediate':
            if (overall === 'fair') {
                recommendations.push('Orta seviye deneyim için uygun');
                recommendations.push('Dikkatli olunması önerilir');
            }
            break;
        case 'advanced':
            if (overall === 'fair' || overall === 'poor') {
                recommendations.push('Deneyimli kullanıcılar için meydan okuyucu koşullar');
                recommendations.push('Ekstra güvenlik önlemleri alın');
            }
            break;
    }
    return {
        overall,
        score: overallScore,
        factors,
        recommendations,
        idealTimeSlots,
        warnings
    };
}
//# sourceMappingURL=weatherController.js.map