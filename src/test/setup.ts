// Setup de test Vitest (jsdom).
import "@testing-library/jest-dom/vitest";

// Mocker l'API (fetch global) : chaque test fournit ses propres réponses via vi.stubGlobal.
// localStorage est fourni par jsdom. Zustand persist y écrit sans souci.
