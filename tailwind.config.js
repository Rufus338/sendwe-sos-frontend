/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Design system UI/UX Pro Max — Emergency SOS & Safety (section 12.2/11)
      colors: {
        primary: "#DC2626", // alert red
        "on-primary": "#FFFFFF",
        secondary: "#EF4444",
        accent: "#2563EB", // safety blue
        "on-accent": "#FFFFFF",
        background: "#FFF1F2",
        foreground: "#0F172A",
        muted: "#FCF1F1",
        "muted-foreground": "#64748B",
        border: "#FAE4E4",
        destructive: "#DC2626",
        ring: "#DC2626",
        // Couleurs fonctionnelles (section 11)
        success: "#16a34a", // vert — disponible/succès/complété
        active: "#2563eb", // bleu — en cours/en intervention
        pending: "#d97706", // orange/ambre — en attente/recherche
        danger: "#dc2626", // rouge — erreur/annulé/hors service/échec
        offline: "#6b7280", // gris — hors ligne/indisponible
      },
      fontFamily: {
        sans: ["Fira Sans", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        modal: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.1)",
        lg: "0 10px 15px rgba(0,0,0,0.1)",
        xl: "0 20px 25px rgba(0,0,0,0.15)",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
    },
  },
  plugins: [],
};
