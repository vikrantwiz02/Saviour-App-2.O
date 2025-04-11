"use client"

import { useState } from "react"
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
  ScrollView,
  Switch,
} from "react-native"
import { useNavigation } from "@react-navigation/core"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons"

const RegisterScreen = () => {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const navigation = useNavigation()

  const handleSignUp = async () => {
    // Validate form fields
    if (!fullName || !username || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (!acceptTerms) {
      Alert.alert("Error", "You must accept the terms and conditions")
      return
    }

    setIsLoading(true)
    try {
      console.log("Starting user registration process...")

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("User created in Firebase Auth:", userCredential.user.uid)

      // Prepare user data
      const userData = {
        uid: userCredential.user.uid,
        fullName,
        username,
        email,
        phoneNumber,
        address: address || "",
        city: city || "",
        state: state || "",
        zipCode: zipCode || "",
        country: country || "",
        dateOfBirth: dateOfBirth || "",
        profileImageUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        userType: "standard",
      }

      console.log("Prepared user data for Firestore:", userData)

      // Save user data to Firestore
      try {
        // Create a document reference with the user's UID
        const userDocRef = doc(db, "users", userCredential.user.uid)

        // Set the document data
        await setDoc(userDocRef, userData)
        console.log("User data saved to Firestore successfully")

        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => {
              // @ts-ignore - Using navigate instead of replace
              navigation.navigate("Login")
            },
          },
        ])
      } catch (firestoreError) {
        console.error("Error saving user data to Firestore:", firestoreError)
        Alert.alert(
          "Registration Incomplete",
          "Your account was created, but we couldn't save your profile information. Please try updating your profile later.",
          [
            {
              text: "OK",
              onPress: () => {
                // @ts-ignore - Using navigate instead of replace
                navigation.navigate("Login")
              },
            },
          ],
        )
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMessage = error?.message || "An unknown error occurred"
      Alert.alert("Registration Error", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
  }

  const navigateToLogin = () => {
    // @ts-ignore - Using navigate instead of replace
    navigation.navigate("Login")
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/icon.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Saviour App</Text>
          <Text style={styles.pageTitle}>Create Account</Text>
        </View>

        <View style={styles.inputContainer}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"Full Name"} style={styles.input} value={fullName} onChangeText={setFullName} />
          </View>

          {/* Username */}
          <View style={styles.inputWrapper}>
            <Ionicons name="at" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Username"}
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Email"}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Phone Number"}
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Date of Birth (MM/DD/YYYY)"}
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Address */}
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"Address"} style={styles.input} value={address} onChangeText={setAddress} />
          </View>

          {/* City */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="location-city" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"City"} style={styles.input} value={city} onChangeText={setCity} />
          </View>

          {/* State */}
          <View style={styles.inputWrapper}>
            <FontAwesome name="map" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"State/Province"} style={styles.input} value={state} onChangeText={setState} />
          </View>

          {/* Zip Code */}
          <View style={styles.inputWrapper}>
            <FontAwesome name="map-pin" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"Zip/Postal Code"} style={styles.input} value={zipCode} onChangeText={setZipCode} />
          </View>

          {/* Country */}
          <View style={styles.inputWrapper}>
            <Ionicons name="globe-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder={"Country"} style={styles.input} value={country} onChangeText={setCountry} />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Password"}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder={"Confirm Password"}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
            />
            <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
              <Ionicons name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: "#e5e7eb", true: "#0782F9" }}
              thumbColor={acceptTerms ? "#fff" : "#f4f3f4"}
            />
            <Text style={styles.termsText}>
              I accept the <Text style={styles.termsLink}>Terms and Conditions</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSignUp} style={styles.button} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0782F9",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
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
  dateText: {
    flex: 1,
    color: "#000",
  },
  eyeIcon: {
    padding: 10,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  termsText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  termsLink: {
    color: "#0782F9",
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
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
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 15,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#0782F9",
    fontWeight: "600",
  },
})
