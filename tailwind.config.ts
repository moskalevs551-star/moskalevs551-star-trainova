const config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "trainova-violet": "#4255FF",
        "trainova-night": "#423ED8",
        "trainova-sky": "#98E3FF",
        "trainova-pink": "#EEAAFF",
        "trainova-orange": "#FFC38C",
        "trainova-ink": "#282E3E",
        "trainova-slate": "#586380",
        "trainova-bg": "#F6F7FB",
        "trainova-green": "#22C55E",
        "trainova-navy": "#282E3E",
        "trainova-cobalt": "#4255FF",
        "trainova-lavender": "#A78BFA",
        "trainova-coral": "#FF6B5A",
      },
    },
  },
  plugins: [],
};

export default config;
