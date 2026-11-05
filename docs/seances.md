# Ajouter ou préciser une séance

Modifier uniquement l’objet du jour concerné dans `schedule.json`. Conserver les dates ISO (`2026-11-10`) et leur ordre. Les jours sont traités comme des dates locales, sans conversion UTC qui pourrait décaler le calendrier.

- `status: "pending"` : journée ouverte (case sans libellé de séance, explication dans la fiche); ne pas ajouter `workout` tant que la séance n’est pas définie.
- `status: "confirmed"` : séance ou repos confirmé.
- `status: "provisional"` : hypothèse affichée comme telle; ne l’utiliser que si Eric demande un programme provisoire.
- `rest: true` : repos; pas de chrono.
- `title`, `summary`, `notes` : texte de la fiche. Garder les consignes courtes et précises.
- Les durées sont en **secondes**. `null` signifie **durée inconnue, étape manuelle**; ce n’est pas zéro.

## Jog en zone 1

Lorsque la durée est confirmée, utiliser une séance `steps` avec une étape. Exemple de structure **sans durée inventée** :

```json
{
  "type": "steps",
  "steps": [
    { "label": "Jog facile", "zone": "Z1", "kind": "easy", "seconds": null }
  ]
}
```

Remplacer `null` par le nombre de secondes donné par Eric pour obtenir un compte à rebours. Sans durée, le chrono compte le temps écoulé jusqu’à l’arrêt manuel. Ne pas recopier automatiquement les séances d’un autre jour.

## Répétitions

`repeats` accepte `blocks`, `reps`, `effortSeconds`, `recoverySeconds`, `betweenBlocksSeconds`, `warmupSeconds` et `cooldownSeconds`. La récupération entre répétitions est ajoutée seulement entre deux efforts d’un même bloc. La récupération entre blocs est une seule étape distincte. Aucune récupération chronométrée n’est ajoutée après le dernier effort, avant le retour au calme.

Si `effortMinutes` est présent dans la fiche, le contrôle vérifie qu’il correspond au total des efforts calculé. Préciser une durée manquante dans les données **et** corriger la description et les notes correspondantes.

## Étapes libres ou répétées

`steps` contient des étapes `{label, kind, zone?, seconds}` ou un groupe `{repeat, steps}`. Les types de couleur sont `easy`, `effort`, `recovery`, `stride` et `race`. Le nom de l’étape et sa zone restent lisibles : la couleur n’est jamais le seul repère.

La séance du 14 utilise `easy-strides` : `durationSeconds`, `strideCount`, `strideSeconds`. Les accélérations sont déclenchées par le coureur. Modifier ce comportement après discussion avec Eric.

## Vérification avant commit

1. Vérifier la date, le statut et toutes les durées avec la consigne d’Eric.
2. Mettre à jour `revision` avec un identifiant lisible.
3. Exécuter `npm run prepare:offline`, `npm test`, puis `npm run check`.
4. Ouvrir la fiche et vérifier les libellés; si le comportement change, lancer aussi les essais navigateur.
5. Commiter les données et `sw.js` ensemble.

Les tests initiaux décrivent les séances confirmées le 5 novembre 2026. Les ajuster lorsque les consignes confirmées changent. Les identifiants de cache se mettent à jour automatiquement avec `prepare:offline`.
