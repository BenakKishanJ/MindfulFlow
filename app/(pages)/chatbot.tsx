// app/(pages)/chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from "expo-router";

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const MentalHealthChatbot = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  // === FETCH MESSAGES ===
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatMessages.push({
          id: doc.id,
          text: data.message,
          sender: data.sender,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      setMessages(chatMessages);
    }, (error) => {
      Alert.alert('Error', 'Failed to load chat history.');
    });

    return () => unsubscribe();
  }, [user]);

  // === AUTO SCROLL ===
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // === SEND MESSAGE ===
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        message: userMessage,
        sender: 'user',
        timestamp: serverTimestamp(),
      });

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        You are a calm, expert digital wellness coach.
        Respond in 2–3 short, practical, kind sentences.
        Focus: eye care, posture, screen breaks, digital balance.
        User: "${userMessage}"
      `;

      const result = await model.generateContent(prompt);
      const botResponse = result.response.text();

      await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        message: botResponse,
        sender: 'bot',
        timestamp: serverTimestamp(),
      });
    } catch (error: any) {
      Alert.alert('Error', error.code === 'resource-exhausted'
        ? 'API limit reached. Try later.'
        : 'Check connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    "Eye strain relief",
    "Phone posture fix",
    "Quick screen break",
    "Digital detox tip",
  ];

  const handleQuickSuggestion = (text: string) => setInputText(text);

  // === UNAUTHENTICATED ===
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-[#212121] font-bold text-lg text-center">
          Sign in to chat with your wellness guide
        </Text>
      </SafeAreaView>
    );
  }

  // === MAIN UI ===
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* === FLOATING BACK BUTTON === */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-14 left-6 w-11 h-11 rounded-full border border-gray-300 items-center justify-center bg-white shadow-sm"
        style={{ zIndex: 10 }}>
        <Text className="text-[#212121] text-xl font-bold">←</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* === WELCOME HEADING (Only on empty chat) === */}
        {messages.length === 0 && (
          <View className="mb-10 items-center">
            <Text className="text-[#212121] font-bold text-3xl text-center mb-2">
              Mindful AI
            </Text>
            <Text className="text-gray-600 font-medium text-base text-center">
              Your personal guide to digital wellness
            </Text>
          </View>
        )}

        {/* === MESSAGES === */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`my-3 flex-row ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <View
              className={`max-w-[82%] px-4 py-3 rounded-2xl border ${msg.sender === 'user'
                ? 'bg-[#212121] border-[#212121]'
                : 'bg-white border-gray-300 shadow-sm'
                }`}
            >
              <Text
                className={`font-medium text-base ${msg.sender === 'user' ? 'text-white' : 'text-[#212121]'
                  }`}
              >
                {msg.text}
              </Text>
              <Text
                className={`text-xs mt-1 font-medium ${msg.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                  }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))}

        {/* === LOADING === */}
        {isLoading && (
          <View className="flex-row justify-start my-3">
            <View className="bg-white border border-gray-300 px-4 py-3 rounded-2xl shadow-sm">
              <ActivityIndicator size="small" color="#000" />
            </View>
          </View>
        )}

        {/* === QUICK SUGGESTIONS === */}
        {messages.length > 0 && !isLoading && (
          <View className="mt-8">
            <Text className="text-gray-600 font-medium text-sm mb-3">
              Try asking:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {quickSuggestions.map((tip, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleQuickSuggestion(tip)}
                  className="border border-gray-300 px-4 py-2 rounded-xl bg-white shadow-sm"
                >
                  <Text className="text-[#212121] font-medium text-sm">{tip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* === INPUT BAR === */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-gray-200"
      >
        <View className="bg-white px-6 py-4">
          <View className="flex-row items-center gap-3">
            {/* Rounded Input */}
            <TextInput
              className="flex-1 bg-white border border-gray-300 px-4 py-3 rounded-xl font-medium text-[#212121] placeholder-gray-500 shadow-sm"
              placeholder="Ask about eye care, posture..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              style={{ minHeight: 48, textAlignVertical: 'center' }}
            />
            {/* Rounded Send Button */}
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`w-12 h-12 rounded-xl border-2 items-center justify-center shadow-sm transition-all ${inputText.trim()
                ? 'bg-lime-400 border-lime-400'
                : 'border-gray-300 bg-white'
                }`}
            >
              <Text
                className={`font-bold text-lg ${inputText.trim() ? 'text-[#212121]' : 'text-gray-400'
                  }`}
              >
                ↑
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>);
};

export default MentalHealthChatbot;
