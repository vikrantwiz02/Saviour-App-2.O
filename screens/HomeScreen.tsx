"use client"

import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"
import { auth, db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

interface UserData {
  fullName: string
  username: string
  email: string
  profileImageUrl?: string
  [key: string]: any
}

const HomeScreen = () => {
  const navigation = useNavigation()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          console.log("No user is signed in")
          setLoading(false)
          return
        }

        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          console.log("User data:", userDoc.data())
          setUserData(userDoc.data() as UserData)
        } else {
          console.log("No user data found!")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigation.navigate("Login" as never)
    } catch (error: any) {
      Alert.alert("Error signing out", error.message)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading user data...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileImagePlaceholder}>
        <Text style={styles.profileImagePlaceholderText}>
          {userData?.fullName?.charAt(0) || userData?.username?.charAt(0) || "U"}
        </Text>
      </View>

      <Text style={styles.title}>Welcome, {userData?.fullName || userData?.username || "User"}!</Text>
      <Text style={styles.subtitle}>You are now logged in to Saviour App</Text>

      {userData && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>Your Profile Information:</Text>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Username:</Text>
            <Text style={styles.userInfoValue}>{userData.username}</Text>
          </View>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Email:</Text>
            <Text style={styles.userInfoValue}>{userData.email}</Text>
          </View>
          {userData.phoneNumber && (
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Phone:</Text>
              <Text style={styles.userInfoValue}>{userData.phoneNumber}</Text>
            </View>
          )}
          {userData.address && (
            <View style={styles.userInfoItem}>
              <Text style={styles.userInfoLabel}>Address:</Text>
              <Text style={styles.userInfoValue}>
                {userData.address}
                {userData.city && `, ${userData.city}`}
                {userData.state && `, ${userData.state}`}
                {userData.zipCode && ` ${userData.zipCode}`}
                {userData.country && `, ${userData.country}`}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#0782F9",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0782F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  userInfoContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#0782F9",
  },
  userInfoItem: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  userInfoLabel: {
    fontWeight: "bold",
    width: 80,
  },
  userInfoValue: {
    flex: 1,
    color: "#333",
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
})

export default HomeScreen
