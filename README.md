# KANTON’NY FANANTENANA — Présences & Assiduité

Application PWA de gestion des présences pour la chorale de l’église FLM 67ha.

## Technologies

- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Hébergement** : GitHub Pages
- **Scanner QR** : html5-qrcode

## Fonctionnalités actuelles

- Authentification (email + mot de passe) + rôles (ADMIN / RESPONSABLE / LECTEUR)
- Gestion des choristes (CRUD, recherche, filtres, import CSV, taux d’assiduité)
- Gestion des répétitions (création, ouverture/fermeture du pointage)
- **Scanner QR multi-appareils** avec anti-doublon garanti au niveau PostgreSQL
- Feedback immédiat après chaque scan
- Interface mobile-first professionnelle

## Installation locale

```bash
git clone https://github.com/rantorm/kanton-ny-fanantenana.git
cd kanton-ny-fanantenana
npm install
cp .env.example .env
```

Remplir `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

Puis :

```bash
npm run dev
```

## Configuration Supabase

1. Créer un projet Supabase
2. Exécuter le script SQL complet (voir historique de conversation ou fichier `supabase/migrations`)
3. Créer les utilisateurs dans Authentication → Users
4. Vérifier/mettre à jour les rôles dans la table `profiles`

## Déploiement GitHub Pages

```bash
npm run build
```

Le dossier `dist/` peut être déployé sur GitHub Pages (workflow Actions à venir).

## Structure du projet

```
src/
  components/     # Composants réutilisables
  pages/          # Pages de l’application
  layouts/        # Layouts (auth + app)
  hooks/          # Hooks React (useAuth…)
  services/       # Appels Supabase
  lib/            # Client Supabase
  types/          # Types TypeScript
  styles/         # CSS global
```

## Licence

Usage interne — Chorale Kanton’ny Fanantenana / FLM 67ha
