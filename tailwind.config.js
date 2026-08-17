/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs fonctionnelles (section 11)
        success: "#16a34a", // vert — disponible/succès/complété
        active: "#2563eb", // bleu — en cours/en intervention
        pending: "#d97706", // orange/ambre — en attente/recherche
        danger: "#dc2626", // rouge — erreur/annulé/hors service/échec
        offline: "#6b7280", // gris — hors ligne/indisponible
      },
    },
  },
  plugins: [],
};
