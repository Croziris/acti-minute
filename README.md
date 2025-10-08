# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fb91095d-e47d-4720-b40e-5c9f5be31ea5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fb91095d-e47d-4720-b40e-5c9f5be31ea5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fb91095d-e47d-4720-b40e-5c9f5be31ea5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Progressive Web App (PWA)

Cette application est une PWA complète, ce qui signifie qu'elle peut être installée sur les appareils mobiles et de bureau pour une expérience native.

### Fonctionnalités PWA

- **Installation sur l'écran d'accueil** : Les utilisateurs peuvent installer l'application directement depuis leur navigateur
- **Mode hors ligne** : L'application fonctionne même sans connexion Internet grâce au Service Worker
- **Mise en cache intelligente** : Les ressources sont mises en cache pour un chargement ultra-rapide
- **Expérience native** : L'application s'affiche en plein écran sans les barres de navigateur
- **Icônes optimisées** : Icônes adaptées à tous les appareils (192x192 et 512x512)

### Tester la PWA localement

1. **Build de production** :
   ```sh
   npm run build
   npm run preview
   ```

2. **Vérifier avec Lighthouse** :
   - Ouvrez Chrome DevTools (F12)
   - Allez dans l'onglet "Lighthouse"
   - Sélectionnez "Progressive Web App"
   - Cliquez sur "Analyze page load"
   - Visez un score > 90

3. **Tester l'installation** :
   - Dans Chrome, cliquez sur l'icône d'installation dans la barre d'adresse
   - Ou utilisez le menu : Plus d'outils > Installer l'application
   - Une bannière d'installation apparaîtra automatiquement

4. **Tester le mode hors ligne** :
   - Installez l'application
   - Dans Chrome DevTools, allez dans "Network"
   - Cochez "Offline"
   - Naviguez dans l'application - elle devrait continuer à fonctionner
   - La page `/offline.html` s'affichera pour les pages non mises en cache

### Fichiers PWA

- **`public/manifest.webmanifest`** : Manifeste de l'application web
- **`public/sw.js`** : Service Worker avec stratégies de cache
- **`public/offline.html`** : Page de fallback hors ligne
- **`public/icons/`** : Icônes de l'application
- **`src/lib/register-sw.ts`** : Utilitaire d'enregistrement du Service Worker
- **`src/components/InstallPWA.tsx`** : Composant de prompt d'installation

### Déploiement PWA

Lorsque vous déployez via Lovable (Share > Publish), la PWA sera automatiquement activée et les utilisateurs pourront l'installer directement depuis votre URL de production.
