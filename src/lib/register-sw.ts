export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers non supportés');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[SW] Enregistré avec succès:', registration.scope);

    // Gestion des mises à jour
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nouvelle version disponible');
            // Optionnel : afficher une notification à l'utilisateur
          }
        });
      }
    });
  } catch (error) {
    console.error('[SW] Erreur lors de l\'enregistrement:', error);
  }
};
