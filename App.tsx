"use client"

import { StyleSheet } from "react-native"
import { useEffect, useRef, useState } from "react"
import AppNavigator from "./navigation/AppNavigator"
import { LogBox } from "react-native"
import * as Notifications from "expo-notifications"
import { registerForPushNotifications, savePushToken } from "./services/notificationService"

// Ignore specific Firebase-related warnings
LogBox.ignoreLogs([
  "Setting a timer",
  "AsyncStorage has been extracted from react-native core",
  "Firebase App named '[DEFAULT]'",
])

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // Register for push notifications
    const registerForNotifications = async () => {
      const token = await registerForPushNotifications()
      if (token) {
        setExpoPushToken(token)
        await savePushToken(token)
      }
    }

    registerForNotifications()

    // Add notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response)
      // Handle notification response (e.g., navigate to specific screen)
    })

    // Clean up listeners on unmount
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])

  return <AppNavigator />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
})
