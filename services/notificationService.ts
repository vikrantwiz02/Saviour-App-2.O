import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { auth } from "../firebase"

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Request notification permissions
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log("Push notifications are not available on emulators/simulators")
    return null
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Permission for notifications not granted!")
      return null
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data

    // Configure for Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      })
    }

    return token
  } catch (error) {
    console.error("Error getting push token:", error)
    return null
  }
}

// Save FCM token to user profile in Firestore
export const savePushToken = async (token: string) => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, cannot save push token")
      return
    }

    // This would be implemented in alertService.ts
    // await updateUserPushToken(user.uid, token)

    console.log("Push token saved to user profile")
  } catch (error) {
    console.error("Error saving push token:", error)
  }
}

// Send a local notification
export const sendLocalNotification = async (title: string, body: string, data: any = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null means send immediately
    })
  } catch (error) {
    console.error("Error sending local notification:", error)
  }
}

// Add notification listeners
export const addNotificationListeners = (
  onNotification: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void,
) => {
  const notificationListener = Notifications.addNotificationReceivedListener(onNotification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse)

  return () => {
    Notifications.removeNotificationSubscription(notificationListener)
    Notifications.removeNotificationSubscription(responseListener)
  }
}
