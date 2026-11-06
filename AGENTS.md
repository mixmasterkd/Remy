# Remy

Projet statique indépendant pour Remy. Lire README.md et docs/seances.md avant de modifier le calendrier.

- Source du programme : schedule.json. Ne pas inventer d’entraînement, de durée ou de zone. Les inconnues restent explicites.
- Accueil : seulement le calendrier interactif, sans accroche, panneau d’aide ou barre du bas. Les détails appartiennent aux fiches ouvertes par les dates.
- Graphiques : aucun stride représenté, même dans les étapes de l’activation; conserver les descriptions et chronos. Les phases d’intervalles représentées partagent exactement les couleurs du chrono. Cette demande remplace l’interdiction initiale du vert à l’accueil.
- Français québécois, langage simple : jog facile, récupération, répétitions, accélérations.
- Activation confirmée vendredi 20 novembre 2026; course samedi 21. La clarification du 5 novembre remplace l’ambiguïté antérieure.
- Repos confirmés les 6, 15 et 19 novembre. Les 16–18 restent ouverts; le 18 est en discussion, sans repos ni séance confirmés. Le 8 : 15 min de jog très facile, repos si jambes lourdes. Jour courant selon America/Toronto, jours passés légèrement estompés mais toujours consultables.
- Garder les données locales au navigateur et le fonctionnement hors ligne. Pas de compte ni de synchronisation implicite.
- Ajustements Galaxy autorisés : calendrier du 5 au 21, grandes cases carrées; chrono gris/bleu ciel/vert/rouge selon phase. Recommandations du 9 : échauffement 10–15 min et retour au calme 5–10 min, sans transition automatique. Correction d’Eric : les strides des 7 et 14 durent tous 20 s; conserver 40 min le 7 et 45 min le 14, objectif six.
- Après toute modification des fichiers du site à la racine, lancer npm run prepare:offline, npm test et npm run check. Pour un changement du chrono ou de navigation, lancer les essais navigateur et tactiles avec le serveur local. Pour le cache, lancer aussi les migrations avec npm run test:update.
- Eric a autorisé explicitement le 5 novembre 2026 le passage de mixmasterkd/Remy en public, historique compris, et GitHub Pages sur main / (root). Ne pas modifier la visibilité ou l’hébergement d’autres dépôts. Aucune modification de GBoxeur ou de CyberAS n’appartient à ce projet.
