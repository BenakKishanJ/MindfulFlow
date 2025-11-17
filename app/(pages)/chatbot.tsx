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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
// import Markdown from 'react-native-markdown-display';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function MentalHealthChatbot() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedChat, setHasLoadedChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // === LAZY LOAD CHAT HISTORY ===
  const loadChatHistory = () => {
    if (!user || hasLoadedChat) return;

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatMessages: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          chatMessages.push({
            id: doc.id,
            text: data.message,
            sender: data.sender,
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        });
        setMessages(chatMessages);
        setHasLoadedChat(true);
      },
      () => {
        Alert.alert('Error', 'Failed to load chat history.');
      }
    );

    return () => unsubscribe();
  };

  // === AUTO SCROLL ===
  useEffect(() => {
    if (hasLoadedChat) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages, hasLoadedChat]);

  // === SEND MESSAGE ===
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || isLoading) return;

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
        Respond in practical, kind sentences.
        Focus: eye care, posture, screen breaks, digital balance, mental health and productivity.
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
      Alert.alert(
        'Error',
        error.code === 'resource-exhausted'
          ? 'API limit reached. Try later.'
          : 'Check connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    'Eye strain relief',
    'Phone posture fix',
    'Quick screen break',
    'Digital detox tip',
  ];

  // === DATE FORMATTER ===
  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // === GROUP MESSAGES BY DATE ===
  const groupedMessages = messages.reduce<Record<string, Message[]>>((groups, msg) => {
    const dateKey = format(msg.timestamp, 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  // === UNAUTHENTICATED ===
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100 justify-center items-center px-6">
        <Text className="text-[#1A1A1A] font-bold text-xl text-center">
          Sign in to chat with your wellness coach
        </Text>
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  //  WELCOME SCREEN – ONLY THIS PART IS MODIFIED
  // ──────────────────────────────────────────────────────────────────────
  if (!hasLoadedChat) {
    return (
      <SafeAreaView className="flex-1 bg-lime-100">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-14 left-6 z-50 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center shadow-md"
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* AI Avatar + Greeting */}
          <ScrollView
            contentContainerClassName="flex-1 justify-center items-center px-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <View className="w-40 h-40 rounded-full overflow-hidden shadow-xl mb-8">
                <Image
                  source={require('@/assets/images/ai-profile.jpg')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-[#1A1A1A] text-3xl font-bold text-center mb-3">
                Hi, I’m Your Wellness Coach
              </Text>
              <Text className="text-gray-600 text-base text-center mb-10 px-6">
                Ask me anything about eye care, posture, screen breaks, or digital balance.
              </Text>
            </View>
          </ScrollView>

          {/* Floating Input – blends with bg */}
          <View className="bg-lime-100 px-6 pb-4 pt-2">
            <View className="flex-row items-center gap-3">
              <TextInput
                className={`
                flex-1 px-4 py-3 rounded-2xl font-medium text-base
                ${inputText ? 'bg-white border border-purple-300' : 'bg-white/80 border border-transparent'}
              `}
                placeholder="Ask about eye care, posture..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={(txt) => {
                  setInputText(txt);
                  if (txt.trim() && !hasLoadedChat) {
                    loadChatHistory();          // ← load chat on first typing
                  }
                }}
                multiline
                maxLength={500}
                autoFocus={false}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className={`
                w-12 h-12 rounded-2xl items-center justify-center shadow-md
                ${inputText.trim()
                    ? 'bg-purple-500'
                    : 'bg-gray-300'}
              `}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? 'white' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // === MAIN CHAT UI ===
  return (
    <SafeAreaView className="flex-1 bg-lime-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-14 left-6 z-50 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center shadow-md"
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 80, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Groups */}
          {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <View key={dateKey}>
              <View className="items-center my-6">
                <View className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                  <Text className="text-gray-600 text-xs font-medium">
                    {formatDateLabel(new Date(dateKey))}
                  </Text>
                </View>
              </View>

              {msgs.map((msg) => (
                <View
                  key={msg.id}
                  className={`my-2 flex-row ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <View
                    className={`
                      max-w-[78%] px-4 py-3 rounded-2xl
                      ${msg.sender === 'user'
                        ? 'bg-[#1A1A1A] rounded-tr-none'
                        : 'bg-[#A3E635] rounded-tl-none'
                      }
                    `}
                  >
                    {/* {msg.sender === 'bot' ? ( */}
                    {/*   <Markdown */}
                    {/*     style={{ */}
                    {/*       body: { */}
                    {/*         color: '#1A1A1A', */}
                    {/*         fontSize: 16, */}
                    {/*         lineHeight: 24, */}
                    {/*         fontFamily: 'System', */}
                    {/*       }, */}
                    {/*       paragraph: { marginTop: 0, marginBottom: 8 }, */}
                    {/*       strong: { fontWeight: '700' }, */}
                    {/*       em: { fontStyle: 'italic' }, */}
                    {/*       list_item: { marginBottom: 4 }, */}
                    {/*       bullet_list: { marginLeft: 8 }, */}
                    {/*     }} */}
                    {/*   > */}
                    {/*     {msg.text} */}
                    {/*   </Markdown> */}
                    {/* ) : ( */}
                    {/*   <Text */}
                    {/*     className="font-medium text-base text-white" */}
                    {/*   > */}
                    {/*     {msg.text} */}
                    {/*   </Text> */}
                    {/* )} */}

                    <Text
                      className={`
    font-medium text-base
    ${msg.sender === 'user' ? 'text-white' : 'text-[#1A1A1A]'}
  `}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      className={`
                        text-xs mt-1 font-medium
                        ${msg.sender === 'user' ? 'text-gray-300' : 'text-[#1A1A1A]/70'}
                      `}
                    >
                      {format(msg.timestamp, 'h:mm a')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Loading */}
          {isLoading && (
            <View className="flex-row justify-start my-2">
              <View className="bg-[#A3E635] px-4 py-3 rounded-2xl rounded-tl-none">
                <ActivityIndicator size="small" color="#1A1A1A" />
              </View>
            </View>
          )}

          {/* Quick Suggestions */}
          {messages.length > 0 && !isLoading && (
            <View className="mt-6">
              <Text className="text-gray-600 font-medium text-sm mb-3">
                Try asking:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quickSuggestions.map((tip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setInputText(tip)}
                    className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    <Text className="text-[#1A1A1A] font-medium text-sm">
                      {tip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Input */}
        <View className="bg-lime-100 px-6 pb-4 pt-2">
          <View className="flex-row items-center gap-3">
            <TextInput
              className={`
                flex-1 px-4 py-3 rounded-2xl font-medium text-base
                ${inputText ? 'bg-purple-100 border-2 border-purple-300' : 'bg-white/80 border border-transparent'}
              `}
              placeholder="Ask about eye care, posture..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={(txt) => {
                setInputText(txt);
              }}
              multiline
              maxLength={500}
              autoFocus={false}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`
                w-12 h-12 rounded-2xl items-center justify-center shadow-md
                ${inputText.trim()
                  ? 'bg-purple-500'
                  : 'bg-gray-300'}
              `}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? 'white' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
