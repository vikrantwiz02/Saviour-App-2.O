"use client"

import { useEffect, useState } from "react"
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native"
import { useNavigation } from "@react-navigation/core"
import { auth, db } from "../firebase"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Ionicons } from "@expo/vector-icons"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user data from Firestore
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            console.log("User data retrieved from Firestore:", userDoc.data())
          } else {
            console.log("No user data found in Firestore")
          }

          // Navigate to Main tab navigator instead of Home screen
          // @ts-ignore - Using navigate for Main screen
          navigation.navigate("Main")
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Still navigate to Main even if there's an error fetching user data
          // @ts-ignore - Using navigate for Main screen
          navigation.navigate("Main")
        }
      }
    })

    return unsubscribe
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Logged in with:", userCredential.user.email)

      // Get user data from Firestore
      try {
        const userDocRef = doc(db, "users", userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          console.log("User data retrieved from Firestore:", userDoc.data())
        } else {
          console.log("No user data found in Firestore for this user")
        }
      } catch (firestoreError) {
        console.error("Error fetching user data:", firestoreError)
      }
    } catch (error: any) {
      const errorMessage = error?.message || "An unknown error occurred"
      Alert.alert("Login Error", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      Alert.alert(
        "Google Sign-In Implementation",
        "For Google Sign-In in a React Native app, you need to use the native Firebase SDK. Would you like to see the implementation steps?",
        [
          {
            text: "No",
            onPress: () => setIsLoading(false),
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: () => {
              setIsLoading(false)
              Alert.alert(
                "Google Sign-In Steps",
                "1. Install @react-native-firebase/app and @react-native-firebase/auth\n\n" +
                  "2. For Android: Configure google-services.json\n\n" +
                  "3. For iOS: Configure GoogleService-Info.plist\n\n" +
                  "4. Use the native GoogleSignin component\n\n" +
                  "This requires native code configuration and can't be done in Expo Go without ejecting.",
                [
                  {
                    text: "Learn More",
                    onPress: () => {
                      Linking.openURL("https://rnfirebase.io/auth/social-auth#google")
                    },
                  },
                  { text: "OK" },
                ],
              )
            },
          },
        ],
      )
    } catch (error: any) {
      const errorMessage = error?.message || "An unknown error occurred"
      Alert.alert("Error", errorMessage)
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const navigateToRegister = () => {
    // @ts-ignore - Using navigate for Register screen
    navigation.navigate("Register")
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/icon.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Saviour App</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder={"Email"}
            style={styles.input}
            value={email}
            onChangeText={(text) => setEmail(text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder={"Password"}
            style={styles.input}
            value={password}
            onChangeText={(pwd) => setPassword(pwd)}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={navigateToRegister}
          style={[styles.button, styles.buttonOutline]}
          disabled={isLoading}
        >
          <Text style={styles.buttonOutlineText}>Create an Account</Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity onPress={handleGoogleSignIn} style={styles.googleButton} disabled={isLoading}>
          <Image
            source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0782F9",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 5,
  },
  forgotPasswordText: {
    color: "#0782F9",
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonOutline: {
    backgroundColor: "white",
    borderColor: "#0782F9",
    borderWidth: 1,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: 16,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  orText: {
    marginHorizontal: 10,
    color: "#6b7280",
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "white",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
})
