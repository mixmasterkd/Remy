# Ajouter ou préciser une séance

Modifier uniquement l’objet du jour concerné dans `schedule.json`. Conserver les dates ISO (`2026-11-10`) et leur ordre. Les jours sont traités comme des dates locales, sans conversion UTC qui pourrait décaler le calendrier.

- `status: "pending"` : journée ouverte (case sans libellé de séance, explication dans la fiche); ne pas ajouter `workout` tant que la séance n’est pas définie.
- `status: "confirmed"` : séance ou repos confirmé.
- `status: "provisional"` : hypothèse affichée comme telle; ne l’utiliser que si Eric demande un programme provisoire.
- `optional: true` sur la journée : séance explicitement facultative, indiquée dans la case et la fiche; conserver son statut confirmé quand Eric a confirmé ce choix.
- `strideInstructions` sur la journée : explication affichée sous Strides, à adapter à la durée, au nombre et au libellé exact du bouton.
- `rest: true` : repos; pas de chrono.
- `title`, `summary`, `notes` : texte de la fiche. Garder les consignes courtes et précises.
- Les durées sont en **secondes**. `null` signifie **durée inconnue, étape manuelle**; ce n’est pas zéro.

## Jog

Lorsque la durée est confirmée, utiliser `{"type":"jog","durationSeconds":1800}` pour un jog de 30 minutes, comme celui du 5. Copier uniquement la durée réellement donnée par Eric. Le moteur ajoute une phase de temps supplémentaire sans limite; **Stop** termine la séance.

`optionalAfterSeconds: 1200` sur un jog de `durationSeconds: 1800` signifie 20–30 minutes : le compte à rebours commence à 30:00 et devient gris après 20 minutes actives. Le seuil ne termine jamais la séance; à zéro, le temps supplémentaire reste actif. `zone: "Z1"` affiche la zone du jog. Ne fixer ce seuil que sur instruction d’Eric.

Pour un jog sans durée définie, une étape `steps` avec `seconds: null` compte vers le haut jusqu’à Stop. Ne jamais remplacer une durée inconnue par zéro.

## Répétitions

`repeats` utilise `blocks`, `reps`, `effortSeconds`, `recoverySeconds` et `betweenBlocksSeconds`. L’échauffement et le retour au calme restent ascendants et manuels. Les anciens champs `warmupSeconds` et `cooldownSeconds` ne déclenchent pas de transition automatique. Les recommandations de durée se placent dans `warmupRecommendation` et `cooldownRecommendation` sur la fiche, sans imposer de compte à rebours. Les totaux utilisent les plages numériques correspondantes `warmupRangeSeconds` et `cooldownRangeSeconds` sur la journée, sous forme `[minimum, maximum]` en secondes (deux valeurs identiques pour une recommandation fixe). Le contrôle vérifie que ces plages et leurs libellés concordent. Une plage absente reste explicitement inconnue dans le total, jamais remplacée par zéro. La récupération entre répétitions est ajoutée seulement entre deux efforts d’un même bloc. La récupération entre blocs est une seule étape distincte. Aucune récupération chronométrée n’est ajoutée après le dernier effort, avant le retour au calme.

`recoveryCue` et `betweenBlocksCue` sur la journée précisent la marche dans le chrono sans modifier la signature de sa séance sauvegardée. `effortCue` et `recoveryCue` dans le programme peuvent préciser le repère affiché pendant les phases, comme « Effort 5 km » et « Très facile » le 16, sans modifier les durées.

Si `effortMinutes` est présent dans la fiche, le contrôle vérifie qu’il correspond au total des efforts calculé. Préciser une durée manquante dans les données **et** corriger la description et les notes correspondantes.

## Étapes libres ou répétées

`steps` contient des étapes `{label, kind, zone?, seconds}` ou un groupe `{repeat, steps}`. Les types de couleur sont `easy` (bleu ciel), `effort` et `stride` (vert), `recovery` (rouge), `warmup`, `cooldown` et `overtime` (gris), `long-recovery` (bleu ciel) et `race`. Le nom de l’étape et sa zone restent lisibles : la couleur n’est jamais le seul repère.

Les séances du 7 et du 14 utilisent `easy-strides` : `durationSeconds`, `strideCount`, `strideSeconds`. `strideCount` est un objectif, pas une limite. Maintien tactile de 1 seconde pour déclencher; le chrono principal continue. Le résumé distingue les déclenchements et les strides terminés.

Les séances `easy-strides` et les séances `steps` contenant des répétitions commencent par défaut avec un échauffement libre, suivi du bouton à maintenir 3 secondes. `warmup: false` est une exception explicite : le jog du 7 commence directement ses 40 minutes et l’activation du 20 garde sa séquence chronométrée confirmée. Ne pas appliquer ces exceptions aux futures séances à intervalles sans consigne d’Eric.

## Vérification avant commit

1. Vérifier la date, le statut et toutes les durées avec la consigne d’Eric.
2. Mettre à jour `revision` avec un identifiant lisible.
3. Exécuter `npm run prepare:offline`, `npm test`, puis `npm run check`.
4. Ouvrir la fiche et vérifier les libellés; si le comportement change, lancer aussi `npm run test:browser` et `npm run test:mobile`.
5. Commiter les données, `sw.js`, `index.html` et `mise-a-jour.html` ensemble : leur identité de version est générée conjointement.

Les tests initiaux décrivent les séances confirmées le 5 novembre 2026. Les ajuster lorsque les consignes confirmées changent. Les identifiants de cache se mettent à jour automatiquement avec `prepare:offline`.
