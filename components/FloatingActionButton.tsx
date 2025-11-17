// components/FloatingActionButton.tsx
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
    "bottom-right": "bottom-20 right-4",
    "bottom-center": "bottom-20 self-center",
    "bottom-left": "bottom-20 left-4",
  };

  return (
    <View className={`absolute ${positionStyles[position]} z-50`}>
      <TouchableOpacity
        onPress={onPress}
        className="w-16 h-16" // Only size, no background, no border, no shadow
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Better tap area
      >
        <Image
          source={require("@/assets/images/ai-profile.jpg")}
          resizeMode="cover"
          className="w-full h-full rounded-full"
        />
      </TouchableOpacity>
    </View>
  );
}
