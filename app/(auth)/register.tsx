// app/(auth)/register.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    // Validation
    if (
      !displayName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!isStrongPassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password should contain at least one uppercase letter, one lowercase letter, and one number",
      );
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, displayName.trim());
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string): boolean => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUppercase && hasLowercase && hasNumber;
  };

  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/operation-not-allowed":
        return "Account creation is currently disabled.";
      case "auth/weak-password":
        return "Password is too weak.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      default:
        return "An error occurred during registration. Please try again.";
    }
  };

  const getPasswordStrength = (): { text: string; color: string } => {
    if (!password) return { text: "", color: "" };

    const hasLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      hasLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;

    if (score < 2) return { text: "Weak", color: "text-red-500" };
    if (score < 4) return { text: "Medium", color: "text-yellow-500" };
    return { text: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
              Create Account
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Sign up to get started with your account
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Display Name Input */}
            <View>
              <Text className="text-gray-700 text-sm font-medium mb-1">
                Full Name
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:border-blue-500"
                placeholder="Enter your full name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-gray-700 text-sm font-medium mb-1">
                Email Address
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:border-blue-500"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-gray-700 text-sm font-medium mb-1">
                Password
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:border-blue-500"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {password && (
                <Text className={`text-xs mt-1 ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.text}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-gray-700 text-sm font-medium mb-1">
                Confirm Password
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50 focus:bg-white focus:border-blue-500"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <Text className="text-xs mt-1 text-red-500">
                  Passwords do not match
                </Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-3 mt-6"
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center text-base font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600 text-base">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                disabled={loading}>
                <Text className="text-blue-600 font-semibold text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Privacy */}
          <Text className="text-gray-500 text-xs text-center mt-8 px-4">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
