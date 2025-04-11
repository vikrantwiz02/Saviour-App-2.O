"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { type Alert, getUserAlerts, markAlertAsRead, subscribeToAlerts } from "../services/alertService"
import { fetchWeatherByCoords } from "../services/weatherService"
import { saveAlertsToFirestore } from "../services/alertService"
import type { RootStackParamList } from "../types"

// Define the navigation prop type
type AlertsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Alerts">

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null)

  // Use properly typed navigation
  const navigation = useNavigation<AlertsScreenNavigationProp>()

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status === "granted")
      return status === "granted"
    } catch (error) {
      console.error("Error requesting location permission:", error)
      setLocationPermission(false)
      return false
    }
  }

  // Fetch weather alerts based on location
  const fetchWeatherAlerts = async () => {
    try {
      if (!locationPermission) {
        const granted = await requestLocationPermission()
        if (!granted) return
      }

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      const weatherData = await fetchWeatherByCoords(latitude, longitude)

      if (weatherData && weatherData.alerts.length > 0) {
        await saveAlertsToFirestore(weatherData.alerts)
      }
    } catch (error) {
      console.error("Error fetching weather alerts:", error)
    }
  }

  // Load alerts from Firestore
  const loadAlerts = async () => {
    try {
      setLoading(true)
      const userAlerts = await getUserAlerts()
      setAlerts(userAlerts)
    } catch (error) {
      console.error("Error loading alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchWeatherAlerts()
    await loadAlerts()
    setRefreshing(false)
  }

  // Handle alert press
  const handleAlertPress = async (alert: Alert) => {
    // Mark as read
    if (!alert.isRead) {
      await markAlertAsRead(alert.id)
    }

    // Navigate to alert detail screen with proper typing
    navigation.navigate("AlertDetail", { alertId: alert.id })
  }

  // Initialize
  useEffect(() => {
    requestLocationPermission()

    // Subscribe to real-time alerts updates
    const unsubscribe = subscribeToAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Fetch alerts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (locationPermission !== null) {
        fetchWeatherAlerts()
      }
    })

    return unsubscribe
  }, [navigation, locationPermission])

  // Render alert severity icon
  const renderSeverityIcon = (severity: string) => {
    switch (severity) {
      case "extreme":
        return <MaterialIcons name="warning" size={24} color="#FF3B30" />
      case "warning":
        return <MaterialIcons name="warning" size={24} color="#FF9500" />
      case "watch":
        return <Ionicons name="eye" size={24} color="#FFCC00" />
      default:
        return <Ionicons name="information-circle" size={24} color="#34C759" />
    }
  }

  // Render alert item
  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={[styles.alertItem, !item.isRead && styles.unreadAlert]}
      onPress={() => handleAlertPress(item)}
    >
      <View style={styles.alertIconContainer}>{renderSeverityIcon(item.severity)}</View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.alertMeta}>
          <Text style={styles.alertSource}>{item.source}</Text>
          <Text style={styles.alertTime}>{new Date(item.createdAt.toDate()).toLocaleString()}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  )

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={60} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Alerts</Text>
      <Text style={styles.emptyDescription}>You don't have any active alerts at the moment. Pull down to refresh.</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts & Notifications</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!locationPermission && (
        <View style={styles.permissionBanner}>
          <MaterialIcons name="location-disabled" size={20} color="#FFFFFF" />
          <Text style={styles.permissionText}>Location permission is required for weather alerts</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocationPermission}>
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadAlert: {
    backgroundColor: "#F0F8FF",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: "#3C3C43",
    marginBottom: 6,
  },
  alertMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertSource: {
    fontSize: 12,
    color: "#8E8E93",
  },
  alertTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C3C43",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  permissionText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
  },
  permissionButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  permissionButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "bold",
  },
})

export default AlertsScreen
