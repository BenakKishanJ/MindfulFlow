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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Replace with your Google AI Studio API key

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

  // Fetch chat history from Firestore
  useEffect(() => {
    if (user) {
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
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        setMessages(chatMessages);
      }, (error) => {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load chat history. Please try again.');
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Add user message to Firestore
      await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        message: userMessage,
        sender: 'user',
        timestamp: serverTimestamp()
      });

      // Get Gemini response
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        You are a virtual mental health consultant specializing in digital wellness. 
        The user said: "${userMessage}"
        
        Please provide a helpful, empathetic response focusing on:
        - Mental health in the digital age
        - Digital eye strain prevention
        - Posture correction for mobile/computer use
        - Healthy digital habits
        - Work-life balance with technology
        
        Keep responses concise (3-4 sentences maximum), supportive, and practical.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const botResponse = response.text();

      // Add bot response to Firestore
      await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        message: botResponse,
        sender: 'bot',
        timestamp: serverTimestamp()
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.code === 'resource-exhausted') {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const quickSuggestions = [
    "How can I reduce eye strain?",
    "Tips for better posture while using phone",
    "Digital detox strategies",
    "Mental health breaks from screens"
  ];

  const handleQuickSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-blue-50 justify-center items-center px-4">
        <Text className="text-lg text-gray-700 text-center">
          Please sign in to use the mental health chatbot
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 py-3 flex-row justify-between items-center">
        <Text className="text-white text-xl font-semibold">Mindful Digital Guide</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text className="text-white text-sm">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Welcome Message */}
          {messages.length === 0 && (
            <View className="bg-white rounded-2xl p-4 my-4">
              <Text className="text-blue-600 font-semibold mb-2">Hello! I&apos;m your digital wellness assistant.</Text>
              <Text className="text-gray-600">
                I&apos;m here to help you with mental health, digital eye care, posture correction,
                and healthy technology habits. How can I assist you today?
              </Text>
            </View>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              className={`my-2 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${message.sender === 'user'
                  ? 'bg-blue-500 rounded-br-none'
                  : 'bg-white rounded-bl-none border border-gray-200'
                  }`}
              >
                <Text
                  className={
                    message.sender === 'user' ? 'text-white' : 'text-gray-800'
                  }
                >
                  {message.text}
                </Text>
                <Text
                  className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View className="my-2 items-start">
              <View className="bg-white rounded-2xl rounded-bl-none px-4 py-3">
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            </View>
          )}

          {/* Quick Suggestions */}
          {messages.length > 0 && !isLoading && (
            <View className="mt-4">
              <Text className="text-gray-500 text-sm mb-2">Quick suggestions:</Text>
              <View className="flex-row flex-wrap">
                {quickSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuickSuggestion(suggestion)}
                    className="bg-blue-100 px-3 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-blue-700 text-sm">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 py-3 bg-white border-t border-gray-200">
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2"
              placeholder="Type your message here..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 p-3 rounded-full"
            >
              <Text className="text-white font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MentalHealthChatbot;
