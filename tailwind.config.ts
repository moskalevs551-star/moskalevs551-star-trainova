const config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "trainova-green": "#10B981",
        "trainova-navy": "#0F172A",
        "trainova-cobalt": "#4F46E5",
        "trainova-lavender": "#A78BFA",
        "trainova-coral": "#FF6B5A",
      },
    },
  },
  plugins: [],
};

export default config;
