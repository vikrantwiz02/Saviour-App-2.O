const API_KEY = "475dad9f469397c42f28ed2ce92b2537"
const BASE_URL = "https://api.openweathermap.org/data/2.5"

export interface WeatherAlert {
  id: string
  event: string
  description: string
  start: number
  end: number
  senderName: string
  severity: string
  areas: string
  source: string
  createdAt: number
}

export interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  alerts: WeatherAlert[]
}

// Function to fetch weather data by coordinates
export const fetchWeatherByCoords = async (latitude: number, longitude: number): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=metric&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    // Process alerts if they exist
    const alerts: WeatherAlert[] = data.alerts
      ? data.alerts.map((alert: any, index: number) => ({
          id: `${alert.event.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}-${index}`,
          event: alert.event,
          description: alert.description,
          start: alert.start,
          end: alert.end,
          senderName: alert.sender_name || "Weather Service",
          severity: getSeverityLevel(alert.event),
          areas: alert.tags?.join(", ") || "Your area",
          source: "OpenWeather",
          createdAt: Date.now(),
        }))
      : []

    return {
      location: data.timezone.split("/")[1].replace("_", " "),
      temperature: Math.round(data.current.temp),
      description: data.current.weather[0].description,
      icon: data.current.weather[0].icon,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_speed,
      alerts,
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return null
  }
}

// Function to fetch weather data by city name
export const fetchWeatherByCity = async (city: string): Promise<WeatherData | null> => {
  try {
    // First get coordinates from city name
    const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`)

    if (!geoResponse.ok) {
      throw new Error(`Geocoding API error: ${geoResponse.status}`)
    }

    const geoData = await geoResponse.json()

    if (!geoData || geoData.length === 0) {
      throw new Error("City not found")
    }

    const { lat, lon } = geoData[0]

    // Then fetch weather using coordinates
    return fetchWeatherByCoords(lat, lon)
  } catch (error) {
    console.error("Error fetching weather by city:", error)
    return null
  }
}

// Helper function to determine severity level based on event type
const getSeverityLevel = (event: string): string => {
  const eventLower = event.toLowerCase()

  if (
    eventLower.includes("extreme") ||
    eventLower.includes("severe") ||
    eventLower.includes("hurricane") ||
    eventLower.includes("tornado")
  ) {
    return "extreme"
  } else if (eventLower.includes("warning") || eventLower.includes("storm") || eventLower.includes("flood")) {
    return "warning"
  } else if (eventLower.includes("watch") || eventLower.includes("advisory")) {
    return "watch"
  } else {
    return "information"
  }
}

// Function to generate safety tips based on alert type
export const getSafetyTips = (alertType: string): string[] => {
  const alertLower = alertType.toLowerCase()

  if (alertLower.includes("flood")) {
    return [
      "Move to higher ground immediately",
      "Do not walk, swim, or drive through flood waters",
      "Stay off bridges over fast-moving water",
      "Evacuate if told to do so",
    ]
  } else if (alertLower.includes("tornado")) {
    return [
      "Go to a basement or an interior room on the lowest floor",
      "Stay away from windows, doors, and outside walls",
      "Do not try to outrun a tornado in a vehicle",
      "Cover your head and neck with your arms",
    ]
  } else if (alertLower.includes("hurricane")) {
    return [
      "Evacuate if advised by authorities",
      "Secure your home and outdoor items",
      "Have emergency supplies ready",
      "Stay indoors during the hurricane",
    ]
  } else if (alertLower.includes("thunderstorm")) {
    return [
      "When thunder roars, go indoors",
      "Stay away from windows and electrical equipment",
      "Avoid using plumbing fixtures",
      "Do not shelter under trees",
    ]
  } else if (alertLower.includes("heat")) {
    return [
      "Stay in air-conditioned areas when possible",
      "Drink plenty of fluids",
      "Wear lightweight, light-colored clothing",
      "Limit outdoor activities during the hottest part of the day",
    ]
  } else if (alertLower.includes("winter") || alertLower.includes("snow") || alertLower.includes("ice")) {
    return [
      "Stay indoors during the storm",
      "Walk carefully on snowy or icy walkways",
      "Keep dry and change wet clothing frequently",
      "Avoid travel if possible",
    ]
  } else {
    return [
      "Stay informed through local news or weather app",
      "Have an emergency kit ready",
      "Follow instructions from local authorities",
      "Check on vulnerable family members and neighbors",
    ]
  }
}
