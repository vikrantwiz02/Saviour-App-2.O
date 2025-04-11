"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Share,
  Alert as RNAlert,
} from "react-native"
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "../firebase"
import type { Alert } from "../services/alertService"

type AlertDetailRouteParams = {
  alertId: string
}

const AlertDetailScreen = () => {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)

  const route = useRoute<RouteProp<Record<string, AlertDetailRouteParams>, string>>()
  const navigation = useNavigation()
  const { alertId } = route.params || {}

  // Fetch alert details
  useEffect(() => {
    const fetchAlertDetails = async () => {
      try {
        if (!alertId || !auth.currentUser) {
          setLoading(false)
          return
        }

        const alertRef = doc(db, `users/${auth.currentUser.uid}/alerts/${alertId}`)
        const alertDoc = await getDoc(alertRef)

        if (alertDoc.exists()) {
          setAlert(alertDoc.data() as Alert)
        } else {
          RNAlert.alert("Error", "Alert not found")
        }
      } catch (error) {
        console.error("Error fetching alert details:", error)
        RNAlert.alert("Error", "Failed to load alert details")
      } finally {
        setLoading(false)
      }
    }

    fetchAlertDetails()
  }, [alertId])

  // Share alert
  const handleShare = async () => {
    if (!alert) return

    try {
      await Share.share({
        title: alert.title,
        message: `${alert.title}\n\n${alert.description}\n\nIssued by: ${alert.source}\nAreas: ${alert.areas}\n\nStay safe!`,
      })
    } catch (error) {
      console.error("Error sharing alert:", error)
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "extreme":
        return "#FF3B30"
      case "warning":
        return "#FF9500"
      case "watch":
        return "#FFCC00"
      default:
        return "#34C759"
    }
  }

  // Get severity label
  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "extreme":
        return "Extreme"
      case "warning":
        return "Warning"
      case "watch":
        return "Watch"
      default:
        return "Information"
    }
  }

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <Ionicons name="thunderstorm" size={24} color="#007AFF" />
      case "disaster":
        return <MaterialIcons name="warning" size={24} color="#FF3B30" />
      case "safety":
        return <Ionicons name="shield-checkmark" size={24} color="#34C759" />
      default:
        return <Ionicons name="information-circle" size={24} color="#5856D6" />
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </SafeAreaView>
    )
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF3B30" />
        <Text style={styles.errorTitle}>Alert Not Found</Text>
        <Text style={styles.errorDescription}>The alert you're looking for doesn't exist or has been removed.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Alert Type Badge */}
        <View style={styles.typeBadge}>
          {getAlertTypeIcon(alert.type)}
          <Text style={styles.typeBadgeText}>{alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert</Text>
        </View>

        {/* Alert Title */}
        <Text style={styles.title}>{alert.title}</Text>

        {/* Alert Metadata */}
        <View style={styles.metadataContainer}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
            <Text style={styles.severityText}>{getSeverityLabel(alert.severity)}</Text>
          </View>

          <Text style={styles.metadata}>
            Issued by {alert.source} • {new Date(alert.createdAt.toDate()).toLocaleString()}
          </Text>
        </View>

        {/* Alert Areas */}
        <View style={styles.areaContainer}>
          <Ionicons name="location" size={20} color="#8E8E93" />
          <Text style={styles.areaText}>{alert.areas}</Text>
        </View>

        {/* Alert Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{alert.description}</Text>
        </View>

        {/* Alert Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing</Text>
          <View style={styles.timingContainer}>
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>Starts</Text>
              <Text style={styles.timingValue}>{new Date(alert.startTime.toDate()).toLocaleString()}</Text>
            </View>
            <View style={styles.timingItem}>
              <Text style={styles.timingLabel}>Ends</Text>
              <Text style={styles.timingValue}>{new Date(alert.endTime.toDate()).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Safety Tips */}
        {alert.safetyTips && alert.safetyTips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            {alert.safetyTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <FontAwesome5 name="shield-alt" size={16} color="#34C759" style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  metadataContainer: {
    marginBottom: 16,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  severityText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  metadata: {
    fontSize: 14,
    color: "#8E8E93",
  },
  areaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  areaText: {
    fontSize: 14,
    color: "#3C3C43",
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#3C3C43",
    lineHeight: 24,
  },
  timingContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 12,
  },
  timingItem: {
    marginBottom: 8,
  },
  timingLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  timingValue: {
    fontSize: 16,
    color: "#000000",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: "#F2FFF5",
    padding: 12,
    borderRadius: 8,
  },
  tipIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: "#3C3C43",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
})

export default AlertDetailScreen
