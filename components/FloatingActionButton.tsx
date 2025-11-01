// components/FloatingActionButton.tsx (updated)
import { Image, TouchableOpacity, View } from "react-native";

interface FloatingActionButtonProps {
  onPress: () => void;
  visible?: boolean;
  position?: "bottom-right" | "bottom-center" | "bottom-left";
}

export default function FloatingActionButton({
  onPress,
  visible = true,
  position = "bottom-right",
}: FloatingActionButtonProps) {
  if (!visible) return null;

  const positionStyles = {
    "bottom-right": "bottom-20 right-4", // Changed from bottom-4 to bottom-20
    "bottom-center": "bottom-20 self-center",
    "bottom-left": "bottom-20 left-4",
  };

  return (
    <View className={`absolute ${positionStyles[position]} z-50`}>
      <TouchableOpacity
        onPress={onPress}
        className="bg-lime-400 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-black/30"
      >
        <Image
          source={require("@/assets/images/ai-profile.jpg")}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}
