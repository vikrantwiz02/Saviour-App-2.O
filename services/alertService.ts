import { db, auth } from "../firebase"
import { collection, doc, setDoc, getDocs, query, orderBy, Timestamp, deleteDoc, onSnapshot } from "firebase/firestore"
import { type WeatherAlert, getSafetyTips } from "./weatherService"
import { sendLocalNotification } from "./notificationService"

// Define the Alert interface with Firestore fields
export interface Alert {
  id: string
  title: string
  description: string
  type: string // weather, disaster, safety
  severity: string // extreme, warning, watch, information
  source: string
  areas: string
  startTime: Timestamp
  endTime: Timestamp
  createdAt: Timestamp
  safetyTips: string[]
  isRead: boolean
  userId?: string // Optional, for user-specific alerts
}

// Maximum number of alerts to keep per user
const MAX_ALERTS_PER_USER = 20

// Convert WeatherAlert to Firestore Alert
export const convertWeatherAlertToFirestoreAlert = (weatherAlert: WeatherAlert): Omit<Alert, "id"> => {
  return {
    title: weatherAlert.event,
    description: weatherAlert.description,
    type: "weather",
    severity: weatherAlert.severity,
    source: weatherAlert.source,
    areas: weatherAlert.areas,
    startTime: Timestamp.fromMillis(weatherAlert.start * 1000),
    endTime: Timestamp.fromMillis(weatherAlert.end * 1000),
    createdAt: Timestamp.fromMillis(weatherAlert.createdAt),
    safetyTips: getSafetyTips(weatherAlert.event),
    isRead: false,
  }
}

// Save alerts to Firestore
export const saveAlertsToFirestore = async (weatherAlerts: WeatherAlert[]): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, cannot save alerts")
      return
    }

    const alertsCollection = collection(db, "alerts")
    const userAlertsCollection = collection(db, `users/${user.uid}/alerts`)

    // Process each alert
    for (const weatherAlert of weatherAlerts) {
      const alertData = convertWeatherAlertToFirestoreAlert(weatherAlert)

      // Save to global alerts collection
      await setDoc(doc(alertsCollection, weatherAlert.id), {
        ...alertData,
        id: weatherAlert.id,
      })

      // Save to user-specific alerts collection
      await setDoc(doc(userAlertsCollection, weatherAlert.id), {
        ...alertData,
        id: weatherAlert.id,
        userId: user.uid,
      })

      // Send notification for new alert
      await sendLocalNotification(alertData.title, alertData.description, { alertId: weatherAlert.id })
    }

    // Clean up old alerts
    await cleanupOldAlerts(user.uid)
  } catch (error) {
    console.error("Error saving alerts to Firestore:", error)
  }
}

// Clean up old alerts, keeping only the most recent ones
export const cleanupOldAlerts = async (userId: string): Promise<void> => {
  try {
    const userAlertsCollection = collection(db, `users/${userId}/alerts`)

    // Get all alerts sorted by creation time
    const alertsQuery = query(userAlertsCollection, orderBy("createdAt", "desc"))

    const alertsSnapshot = await getDocs(alertsQuery)
    const allAlerts = alertsSnapshot.docs

    // If we have more than the maximum, delete the oldest ones
    if (allAlerts.length > MAX_ALERTS_PER_USER) {
      const alertsToDelete = allAlerts.slice(MAX_ALERTS_PER_USER)

      for (const alertDoc of alertsToDelete) {
        await deleteDoc(alertDoc.ref)
      }

      console.log(`Deleted ${alertsToDelete.length} old alerts`)
    }
  } catch (error) {
    console.error("Error cleaning up old alerts:", error)
  }
}

// Get all alerts for the current user
export const getUserAlerts = async (): Promise<Alert[]> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, cannot get alerts")
      return []
    }

    const userAlertsCollection = collection(db, `users/${user.uid}/alerts`)
    const alertsQuery = query(userAlertsCollection, orderBy("createdAt", "desc"))

    const alertsSnapshot = await getDocs(alertsQuery)

    return alertsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
      } as Alert
    })
  } catch (error) {
    console.error("Error getting user alerts:", error)
    return []
  }
}

// Mark an alert as read
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, cannot mark alert as read")
      return
    }

    const alertRef = doc(db, `users/${user.uid}/alerts/${alertId}`)
    await setDoc(alertRef, { isRead: true }, { merge: true })
  } catch (error) {
    console.error("Error marking alert as read:", error)
  }
}

// Subscribe to real-time alerts updates
export const subscribeToAlerts = (onAlertsUpdate: (alerts: Alert[]) => void): (() => void) => {
  const user = auth.currentUser
  if (!user) {
    console.log("No user logged in, cannot subscribe to alerts")
    return () => {}
  }

  const userAlertsCollection = collection(db, `users/${user.uid}/alerts`)
  const alertsQuery = query(userAlertsCollection, orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
      } as Alert
    })

    onAlertsUpdate(alerts)
  })

  return unsubscribe
}

// Add a custom safety tip alert
export const addSafetyTipAlert = async (title: string, description: string, tips: string[]): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.log("No user logged in, cannot add safety tip")
      return
    }

    const alertId = `safety-tip-${Date.now()}`
    const userAlertsCollection = collection(db, `users/${user.uid}/alerts`)

    const alertData: Alert = {
      id: alertId,
      title,
      description,
      type: "safety",
      severity: "information",
      source: "Saviour App",
      areas: "General",
      startTime: Timestamp.now(),
      endTime: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: Timestamp.now(),
      safetyTips: tips,
      isRead: false,
      userId: user.uid,
    }

    await setDoc(doc(userAlertsCollection, alertId), alertData)

    // Send notification for new safety tip
    await sendLocalNotification(title, description, { alertId })
  } catch (error) {
    console.error("Error adding safety tip alert:", error)
  }
}
