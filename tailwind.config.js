/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F7F5F0", // Muted Cream (main app bg)
        surface: "#FFFFFF", // Pure white (cards, modals)
        text: {
          primary: "#1A1A1A", // Deep Charcoal
          secondary: "#555555", // Mid-gray
          disabled: "#999999",
        },
        primary: "#0F0F0F", // Rich Black (illustrations, dark mode base)
        secondary: "#1C1C1C", // Softer black (alt surfaces)

        accent: {
          main: "#F0FE53", // Coral-Orange (CTA, primary actions)
          hover: "#C2CB3F",
          light: "#FFE0D6", // Very light peach (accent bg)
        },

        pastel: {
          lavender: "#E8E0FF", // Soft purple card / tag
          mint: "#D6F4EA", // Calm green card / success
          peach: "#FFE5D9", // Warm pastel card / highlight
          sky: "#DBE8FF", // Cool blue card / info
          sage: "#E0E8E0", // Muted green-gray card / neutral
        },

        ui: {
          border: "#E5E5E5", // Subtle card/input borders
          shadow: "rgba(0, 0, 0, 0.08)",
          overlay: "rgba(15, 15, 15, 0.9)",
        },

        illustration: {
          line: "#1A1A1A", // Contour lines
          fill: "#0F0F0F", // Solid black fill
          bg: "#0F0F0F", // Dark illustration container
        },
      },
      fontFamily: {
        sans: ["PPMori-Regular"],
        "ppmori-extralight": ["PPMori-Extralight"],
        "ppmori-extralight-italic": ["PPMori-ExtralightItalic"],
        "ppmori-regular": ["PPMori-Regular"],
        "ppmori-regular-italic": ["PPMori-RegularItalic"],
        "ppmori-semibold": ["PPMori-SemiBold"],
        "ppmori-semibold-italic": ["PPMori-SemiBoldItalic"],
      },
    },
  },
  plugins: [],
};
