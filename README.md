# 🚑 Sendwe SOS — Dashboard Hôpital (React)

Dashboard d'administration pour les **hôpitaux** : gestion des ambulances, des ambulanciers, suivi temps réel des interventions sur carte, et paramètres de l'hôpital.

## Stack

- **React 18** + **TypeScript**
- **Vite 6** (build)
- **Tailwind CSS 3** (design system « Emergency SOS & Safety »)
- **MapLibre GL** (carte temps réel)
- **Zustand** (état / auth)
- **WebSocket** (temps réel)

## Configuration

| Variable | Valeur | Rôle |
|---|---|---|
| `VITE_API_URL` | (proxy Vite → `/api` vers `localhost:8000`) | API backend |

Le proxy est configuré dans `vite.config.ts` (port **5174** par défaut, car 5173 est souvent occupé).

## Lancer en développement

```bash
npm install
npm run dev
```

Dashboard : http://localhost:5174

## Build de production

```bash
npm run build      # typecheck + Vite build → dist/
npm run lint       # ESLint
```

## Connexion

- **Admin hôpital** : créé par le super admin (décision 7) — voir `SUIVI_PROGRESSION.md` du backend pour les comptes de démo.
