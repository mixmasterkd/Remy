# Remy

Projet statique indépendant pour Remy. Lire README.md et docs/seances.md avant de modifier le calendrier.

- Source du programme : schedule.json. Ne pas inventer d’entraînement, de durée ou de zone. Les inconnues restent explicites.
- Accueil : seulement le calendrier interactif, sans accroche, panneau d’aide ou barre du bas. Les détails appartiennent aux fiches ouvertes par les dates.
- Calendrier : afficher « strides » dans les cases des 7, 14, 18 et 20, sans les dessiner dans les graphiques.
- Graphiques : aucun stride représenté, même dans les étapes de l’activation; conserver les descriptions et chronos. Les phases d’intervalles représentées partagent exactement les couleurs du chrono. Cette demande remplace l’interdiction initiale du vert à l’accueil.
- Français québécois, langage simple : jog facile, récupération, répétitions, accélérations.
- Activation confirmée vendredi 20 novembre 2026; course samedi 21. La clarification du 5 novembre remplace l’ambiguïté antérieure.
- Dernières décisions du 6 novembre : repos les 6, 13, 15 et 19; le 8, 15 min très faciles ou repos si jambes lourdes; le 17, 15 min très faciles confirmées.
- Le 10 : jog Z1 20–30 min, chrono 30:00 bleu ciel puis gris après 20 min. Les 10 dernières minutes sont facultatives; aucun arrêt automatique, temps supplémentaire puis résumé au Stop.
- Le 12 : jog très léger 20–30 min, avec le même compte à rebours et la même portion facultative que le 10. Ne pas reprendre l’ancienne demande 15–20 min.
- Le 16 : échauffement conseillé 10 min mais libre, 3 × 2 min à effort 5 km, seulement 2 récupérations de 1 min très facile, retour conseillé 5 min mais libre; total indicatif 23 min. Le 18 : facultatif, 20 min très faciles et 4 strides de 10 s, chrono/maintien/compteur existants. Le 20 reste inchangé.
- Explications sous Strides les 7, 14 et 18, adaptées aux 40/40/20 min et 6×20/6×20/4×10 s : répartition libre, vitesse contrôlée sans sprint, maintien du bouton 1 s, récupération jusqu’à respiration régulière. Les 9 et 11 ont les mêmes références : 10 min d’échauffement et 8 min de retour au calme, toujours en chrono libre; les dix efforts et neuf récupérations du 11 restent inchangés.
- Totaux des 9, 11 et 16 : inclure les récupérations et les plages conseillées, sans inventer les durées absentes. Le 9 vaut 58 min, avec une seule marche de 4 min entre blocs et six récupérations de 2 min au total; le 11, 47 min avec les références 10 / 8 min; le 16, 23 min conseillées. Récupérations marchées; entre blocs du 9, 4 min de marche confirmées et décomptées, puis départ automatique du bloc 2. Ne pas ajouter de récupération de 2 min à cette pause.
- Dans les cases, afficher seulement le total calculé pour les intervalles (58 min le 9, 47 min le 11), sans « + pause » quand toutes les durées sont définies.
- Jour courant selon America/Toronto, encadré conservé; jours passés légèrement estompés mais toujours consultables.
- Garder les données locales au navigateur et le fonctionnement hors ligne. Pas de compte ni de synchronisation implicite.
- Ajustements Galaxy autorisés : calendrier du 5 au 21, grandes cases carrées; chrono gris/bleu ciel/vert/rouge selon phase. Références des 9 et 11 : échauffement 10 min et retour au calme 8 min, sans transition automatique. Correction d’Eric : les strides des 7 et 14 durent tous 20 s; conserver 40 min les 7 et 14, objectif six.
- Après toute modification des fichiers du site à la racine, lancer npm run prepare:offline, npm test et npm run check. Pour un changement du chrono ou de navigation, lancer les essais navigateur et tactiles avec le serveur local. Pour le cache, lancer aussi les migrations avec npm run test:update.
- Eric a autorisé explicitement le 5 novembre 2026 le passage de mixmasterkd/Remy en public, historique compris, et GitHub Pages sur main / (root). Ne pas modifier la visibilité ou l’hébergement d’autres dépôts. Aucune modification de GBoxeur ou de CyberAS n’appartient à ce projet.
