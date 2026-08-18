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
| `VITE_API_URL` | `https://sendwe-sos-backend-production.up.railway.app` | URL du backend en production (Cloudflare Pages → Railway). Vide en dev : proxy Vite `/api` → `localhost:8000` |

Le proxy est configuré dans `vite.config.ts` (port **5174** par défaut, car 5173 est souvent occupé).

### Production (Cloudflare Pages + Railway)

Le dashboard et l'API sont sur **deux domaines différents** :

- **Frontend** : `https://sendwe-sos-frontend.thaumaturgemutombo.workers.dev` (Cloudflare Workers)
- **Backend** : `https://sendwe-sos-backend-production.up.railway.app` (Railway)

1. **Frontend** — `VITE_API_URL` doit pointer vers l'URL publique du backend
   Railway au moment du **build** (Vite l'injecte en dur dans le bundle). Deux
   façons de la définir :
   - **CI/CD (GitHub Actions, recommandé)** : voir `.github/workflows/deploy.yml`.
     Définir la variable GitHub `VITE_API_URL` (Settings → Secrets and variables →
     Actions → Variables) + les secrets `CLOUDFLARE_API_TOKEN` et
     `CLOUDFLARE_ACCOUNT_ID`.
   - **Dashboard Cloudflare Pages** → Settings → *Environment variables* →
     `VITE_API_URL`, puis redéployer (variable de build).
2. **Backend Railway** → variables : `CORS_ORIGINS` doit contenir le domaine
   Cloudflare du dashboard (ex. `https://sendwe-dashboard.pages.dev`), en plus des
   origines locales.

> ⚠️ Ne jamais utiliser l'adresse interne `*.railway.internal` : elle n'est pas
> accessible depuis un navigateur.

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
