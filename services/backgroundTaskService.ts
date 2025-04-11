import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
import { fetchWeatherByCoords } from "./weatherService"
import { saveAlertsToFirestore, cleanupOldAlerts } from "./alertService"
import { auth } from "../firebase"

// Define task names
const BACKGROUND_FETCH_TASK = "background-fetch-weather-alerts"
const LOCATION_TASK = "background-location-task"

// Register background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("Running background fetch task")

    // Check if user is logged in
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, skipping background fetch")
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    // Fetch weather data
    const weatherData = await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude)

    // If we have alerts, save them to Firestore
    if (weatherData && weatherData.alerts.length > 0) {
      await saveAlertsToFirestore(weatherData.alerts)
      console.log(`Saved ${weatherData.alerts.length} alerts in background task`)
      return BackgroundFetch.BackgroundFetchResult.NewData
    }

    // Clean up old alerts
    await cleanupOldAlerts(user.uid)

    return BackgroundFetch.BackgroundFetchResult.NoData
  } catch (error) {
    console.error("Error in background fetch task:", error)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// Register background location task
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Error in background location task:", error)
    return
  }

  if (data) {
    const { locations } = data
    const location = locations[0]

    // Only process if we have a valid location
    if (location) {
      try {
        // Check if user is logged in
        const user = auth.currentUser
        if (!user) {
          console.log("No user logged in, skipping location task")
          return
        }

        // Fetch weather data
        const weatherData = await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude)

        // If we have alerts, save them to Firestore
        if (weatherData && weatherData.alerts.length > 0) {
          await saveAlertsToFirestore(weatherData.alerts)
          console.log(`Saved ${weatherData.alerts.length} alerts in location task`)
        }
      } catch (error) {
        console.error("Error processing location update:", error)
      }
    }
  }
})

// Register background fetch
export const registerBackgroundFetch = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    })

    console.log("Background fetch task registered")
  } catch (error) {
    console.error("Error registering background fetch task:", error)
  }
}

// Register background location updates
export const registerBackgroundLocation = async () => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync()

    if (status === "granted") {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30 * 60 * 1000, // 30 minutes
        distanceInterval: 5000, // 5 kilometers
        foregroundService: {
          notificationTitle: "Saviour App",
          notificationBody: "Monitoring for weather alerts in your area",
        },
      })

      console.log("Background location task registered")
    } else {
      console.log("Background location permission not granted")
    }
  } catch (error) {
    console.error("Error registering background location task:", error)
  }
}

// Unregister background tasks
export const unregisterBackgroundTasks = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)

    if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK)
    }

    console.log("Background tasks unregistered")
  } catch (error) {
    console.error("Error unregistering background tasks:", error)
  }
}
