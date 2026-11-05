# Remy / course

Un carnet mobile personnel pour Remy, préparé avec Eric : calendrier du **7 au 21 novembre 2026**, fiches de séance, suivi local et chronomètre. Objectif : **Oxford Cup, samedi 21 novembre**, environ **4,8 à 5 km**; horaire exact à confirmer.

Site statique en français québécois, sans compte, sans service de suivi sportif et sans dépendance d’exécution. Le contenu de `public/` est autonome. Le projet est commité et sauvegardé dans le dépôt GitHub privé [mixmasterkd/Remy](https://github.com/mixmasterkd/Remy). Aucun hébergement public n’est configuré.

## Utilisation

1. Toucher une case du calendrier pour ouvrir sa fiche.
2. Ouvrir le chronomètre, puis toucher **Démarrer**. Il demande le plein écran et le maintien de l’écran éveillé quand le navigateur le permet.
3. Les commandes se verrouillent au démarrage et à la reprise. Maintenir le bouton de verrouillage **3 secondes** pour déverrouiller ou verrouiller. Un relâchement trop tôt annule le geste.
4. **Pause** exclut le temps d’arrêt. Pour revenir au calendrier, déverrouiller puis mettre en pause.
5. Les étapes sans durée comptent le temps écoulé. Après le démarrage, utiliser **Passer à la suite** ou **Terminer la séance**. Elles ne déclenchent pas la suite automatiquement.
6. **Marquer la séance faite** met une coche dans le calendrier. Le même bouton permet d’annuler. Terminer le chrono ne coche pas automatiquement la séance.

Le suivi et les chronos sont enregistrés séparément pour chaque date dans `localStorage`. Ils appartiennent au navigateur, au profil et à l’adresse du site utilisés. Pas de synchronisation entre le téléphone d’Eric et celui de Remy, ni entre Chrome et un autre navigateur. Effacer les données peut effacer le suivi. Utiliser une seule fenêtre du chrono à la fois.

### Android / Chrome

Cible : téléphone Android de Remy, probablement Galaxy S24; Eric fera un essai sur son Galaxy S25. Une fois une adresse HTTPS choisie, ouvrir le site dans Chrome, puis le menu **⋮ → Ajouter à l’écran d’accueil / Installer l’application**, selon le libellé proposé. Une icône et un manifeste sont fournis, avec des icônes PNG 192 et 512 px.

Attendre **Prêt hors ligne** avant de partir. Le site utilise un service worker en contexte sécurisé (HTTPS ou localhost). Il fonctionne ensuite sans réseau, y compris après rechargement tant que le navigateur conserve son cache. Un lien HTTP local ouvert depuis un autre appareil ne suffit pas pour vérifier l’installation et le cache sécurisé.

Le plein écran et le maintien de l’écran éveillé restent à vérifier sur les appareils réels. Le navigateur ou Android peuvent les refuser ou les interrompre. Le verrouillage des commandes n’est pas un verrouillage du téléphone. Les sons, les vibrations et l’exécution en arrière-plan ne sont pas garantis; cette version émet seulement un court son de changement de phase quand l’audio est disponible. Garder la page visible. Au retour, les horodatages recalculent l’étape et le temps écoulé; les sons manqués ne sont pas rejoués.

## Séances confirmées

| Date | Séance | Ce qui reste à préciser |
|---|---|---|
| Lun. 9 | 2 blocs de 4 × 3 min; 2 min entre répétitions; **24 min d’effort** | Échauffement, récupération entre blocs, retour au calme |
| Mer. 11 | 10 × 2 min; 1 min entre répétitions; **20 min d’effort** | Échauffement et retour au calme |
| Sam. 14 | **45 min faciles**, incluant 6 accélérations de 10 s; récupération complète | Ergonomie du bouton d’accélération à discuter |
| Dim. 15 | Repos | — |
| Ven. 20 | 5 min Z1, 5 min Z3, 5 × (20 s Z4–Z5 + 40 s faciles), 5 min Z1 : **20 min** | Date confirmée par Eric après clarification |
| Sam. 21 | Oxford Cup; chrono libre | Horaire exact; environ 4,8–5 km |

Les autres journées restent **à préciser**. Une séance le 16, un petit jog avec accélérations le 18 et du repos le 19 ont été évoqués sans confirmation. Les jogs en zone 1 seront ajoutés par Eric.

Pour le 14, le bouton lance exactement 10 secondes, six fois au maximum. Le chrono principal continue : ces secondes sont **incluses** dans les 45 minutes. Aucune récupération n’est minutée et aucune accélération ne part seule. Une nouvelle accélération est refusée s’il reste moins de 10 secondes. Ce comportement est une ébauche à discuter.

## Lancer et vérifier

Node.js 22 ou plus récent. Aucune installation nécessaire pour le serveur local ou les tests du moteur.

```sh
npm start                 # http://127.0.0.1:4173
npm test                  # moteur et calendrier
npm run check             # validation des données et du cache
```

Pour les essais automatisés Chromium, dans un second terminal pendant que le serveur tourne :

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

Un Chromium existant peut être choisi avec `CHROMIUM_PATH=/chemin/vers/chrome npm run test:browser`. Les captures vont dans `test-results/` (non versionné). Les tests utilisent des profils temporaires; ils ne touchent pas au suivi réel du navigateur de Remy.

## Modifier les séances par commit

Tout le calendrier est dans [`public/schedule.json`](public/schedule.json). Voir le [guide de modification](docs/seances.md). Après toute modification dans `public/` :

```sh
npm run prepare:offline
npm test
npm run check
git add public
git commit -m "Précise la séance du 10 novembre"
```

`prepare:offline` met à jour la version du cache d’après le contenu des fichiers. `check` refuse un cache périmé. Une nouvelle version attend la fermeture des anciennes fenêtres : pas de remplacement du programme au milieu d’un chrono. Après mise en ligne d’une modification, ouvrir le site connecté, fermer toutes ses fenêtres, puis le rouvrir pour activer la version en attente. Une séance modifiée ne reprend pas un ancien chrono incompatible.

## Structure

- `public/schedule.json` : séances et états confirmés / à préciser.
- `public/engine.js` : moteur pur, temps en millisecondes, phases compilées.
- `public/app.js` : calendrier, suivi local, commandes, audio et API du téléphone.
- `public/style.css` : identité visuelle indépendante, calendrier et vues du chrono.
- `public/sw.js` : cache atomique de la version courante.
- `tests/` : tests de séquence et parcours Chromium.
- `docs/verification.md` : vérifications réalisées et limites.

Le moteur utilise `Date.now()` et des écarts d’horodatages; le rafraîchissement de l’écran n’est pas l’horloge. Il rattrape plusieurs étapes chronométrées après un retard et s’arrête sur les étapes ouvertes. Un changement manuel de l’heure du téléphone peut affecter le calcul : les sauts négatifs sont neutralisés, mais les sauts positifs restent indistinguables d’un temps réellement écoulé.

Références des limites des API : [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [Fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API), [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
