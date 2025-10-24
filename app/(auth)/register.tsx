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
  Image,
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
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!isStrongPassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password must contain uppercase, lowercase, and a number"
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
      Alert.alert("Registration Failed", getFirebaseErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (pw: string) =>
    /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);

  const getFirebaseErrorMessage = (code: string) => {
    const map: Record<string, string> = {
      "auth/email-already-in-use": "This email is already in use.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password is too weak.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] ?? "An unexpected error occurred.";
  };

  return (

    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View className="items-center pt-20 pb-0">
          <Image
            source={require("@/assets/images/auth-illustration.png")}
            resizeMode="contain"
            className="w-80 h-80"
          />
        </View>

        <View className="px-8 flex-1 justify-center">
          {/* Header */}
          <Text className="text-3xl font-bold text-center mb-2 text-black">
            Register
          </Text>
          <Text className="text-base text-center text-gray-600 mb-8">
            Create your account
          </Text>

          {/* Full Name */}
          <View className="mb-6">
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              className="border-b border-gray-300 pb-2 text-base"
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View className="mb-6">
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border-b border-gray-300 pb-2 text-base"
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View className="mb-6">
            <TextInput
              placeholder="Password (8-16 characters)"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              className="border-b border-gray-300 pb-2 text-base"
              editable={!loading}
            />
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              className="border-b border-gray-300 pb-2 text-base"
              editable={!loading}
            />
            {confirmPassword && password !== confirmPassword && (
              <Text className="text-xs mt-1 text-red-600">
                Passwords do not match
              </Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="bg-black rounded-full py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Register
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={loading}
            >
              <Text className="text-lime-500 font-medium">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
