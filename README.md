# Remy / course

Un carnet mobile personnel pour Remy, préparé avec Eric : calendrier du **5 au 21 novembre 2026**, fiches de séance, suivi local et chronomètre. Objectif : **Oxford Cup, samedi 21 novembre**, environ **4,8 à 5 km**; horaire exact à confirmer.

Site statique en français québécois, sans compte, sans service de suivi sportif et sans dépendance d’exécution. `index.html` et tous les fichiers du site se trouvent à la racine du dépôt. Le projet est sauvegardé dans le dépôt public [mixmasterkd/Remy](https://github.com/mixmasterkd/Remy). GitHub Pages est activé pour le [calendrier de Remy](https://mixmasterkd.github.io/Remy/), avec l’accord explicite d’Eric.

## Utilisation

L’écran d’accueil contient uniquement le calendrier : chaque journée est une case cliquable. Les journées sans séance restent visuellement vides; leur fiche explique ce qui est connu. La coche distingue les séances faites. Les jours de repos ont un fond pâle distinct. La date courante est mise en évidence selon `America/Toronto`, même si le téléphone utilise un autre fuseau. Les jours passés sont légèrement estompés, mais restent consultables et utilisables. Le repère se met à jour chaque minute et au retour sur la page.

1. Toucher une case du calendrier pour ouvrir sa fiche. La croix ou la touche Échap ramène au calendrier.
2. Ouvrir le chronomètre et toucher **Démarrer**. Les commandes se verrouillent; maintenir leur bouton **3 secondes** pour les libérer.
3. Pour les séances à intervalles, l’échauffement compte vers le haut. Maintenir **Commencer les intervalles** pendant **3 secondes** quand prêt. Ce bouton est distinct du verrouillage et reste accessible quand les commandes sont verrouillées.
4. Les efforts et les récupérations courtes comptent vers zéro. La pause inconnue entre les blocs du 9 reste libre : maintenir **Commencer le bloc 2** pendant **3 secondes** pour repartir.
5. Pour les strides, maintenir le bouton secondaire **1 seconde**. Le chrono principal continue; un second affichage décompte le stride. Le compteur augmente au déclenchement et peut dépasser l’objectif de six.
6. À zéro, un jog poursuit un chrono ascendant de **temps supplémentaire**. Déverrouiller puis toucher **Stop · résumé** pour terminer. Un stride déjà lancé peut finir pendant ce temps; aucun nouveau stride ne part après le temps prévu du jog.
7. **Pause** fige les deux chronos; **Reprendre** les relance et verrouille les commandes. Le résumé distingue le temps de chaque phase, les strides lancés, complétés et interrompus.
8. **Marquer la séance faite** coche le calendrier. Terminer le chrono ne coche pas automatiquement la séance.

Couleurs du chrono : jog et pause entre blocs **bleu ciel**, échauffement/retour au calme/temps supplémentaire **gris**, efforts et strides **vert**, récupérations courtes **rouge**. Deux variations légères de luminosité signalent la fin d’un stride; elles sont désactivées si la réduction des animations est demandée sur l’appareil.

Les cases des journées avec strides portent ce libellé. Les graphiques du calendrier et des fiches ne représentent pas les strides; ceux-ci restent dans les descriptions et les chronomètres. Les phases d’intervalles représentées utilisent les couleurs du chrono. Les jogs ont une barre continue.

Le suivi et les chronos sont enregistrés séparément pour chaque date dans `localStorage`. Ils appartiennent au navigateur, au profil et à l’adresse du site utilisés. Pas de synchronisation entre le téléphone d’Eric et celui de Remy, ni entre Chrome et un autre navigateur. Effacer les données peut effacer le suivi. Utiliser une seule fenêtre du chrono à la fois.

### Android / Chrome

Cible : téléphone Android de Remy, probablement Galaxy S24; Eric fera un essai sur son Galaxy S25. Une fois une adresse HTTPS choisie, ouvrir le site dans Chrome, puis le menu **⋮ → Ajouter à l’écran d’accueil / Installer l’application**, selon le libellé proposé. Une icône et un manifeste sont fournis, avec des icônes PNG 192 et 512 px.

Ouvrir une fiche et attendre **Prêt hors ligne** avant de partir. Le site utilise un service worker en contexte sécurisé (HTTPS ou localhost). Il fonctionne ensuite sans réseau, y compris après rechargement tant que le navigateur conserve son cache. Un lien HTTP local ouvert depuis un autre appareil ne suffit pas pour vérifier l’installation et le cache sécurisé.

Le plein écran et le maintien de l’écran éveillé restent à vérifier sur les appareils réels. Le navigateur ou Android peuvent les refuser ou les interrompre. Le verrouillage des commandes n’est pas un verrouillage du téléphone. Les sons, les vibrations et l’exécution en arrière-plan ne sont pas garantis; cette version émet seulement un court son de changement de phase quand l’audio est disponible. Garder la page visible. Au retour, les horodatages recalculent l’étape et le temps écoulé; les sons manqués ne sont pas rejoués.

## Séances confirmées

| Date | Séance | Repères |
|---|---|---|
| Jeu. 5 | 30 min de jog | — |
| Ven. 6 | Repos | — |
| Sam. 7 | 40 min de jog + 6 strides de 20 s | Déclenchements libres, guide sous Strides |
| Dim. 8 | 15 min très faciles | Repos si jambes lourdes |
| Lun. 9 | 2 blocs de 4 × 3 min, 2 min de marche entre efforts | Total : 51–61 min + pause interblocs à confirmer; recommandations 10–15 / 5–10 min |
| Mar. 10 | 20–30 min en Z1 | Arrêt possible après 20 min; les dix dernières sont facultatives |
| Mer. 11 | 10 × 2 min, 1 min de marche entre efforts | Total : 29 min + échauffement et retour non définis |
| Jeu. 12 | 20–30 min de jog très léger | Même chrono que le 10; arrêt possible après 20 min |
| Ven. 13 | Repos | — |
| Sam. 14 | 40 min faciles + 6 strides de 20 s | Échauffement libre; guide sous Strides |
| Dim. 15 | Repos | Inchangé |
| Lun. 16 | 3 × 2 min à effort 5 km, 1 min de marche très facile entre efforts | Deux récupérations; 10 min d’échauffement et 5 min de retour conseillées, libres; 23 min si suivies |
| Mar. 17 | 15 min très faciles | Confirmé |
| Mer. 18 | Facultatif : 20 min très faciles + 4 strides de 10 s | Échauffement libre, maintien 1 s, compteur sans plafond, guide adapté |
| Jeu. 19 | Repos | — |
| Ven. 20 | 5 min Z1, 5 min Z3, 5 × (20 s Z4–Z5 + 40 s faciles), 5 min Z1 | Activation inchangée de 20 min |
| Sam. 21 | Oxford Cup, chrono libre | Environ 4,8–5 km; horaire à confirmer |

Les 10 et 12 commencent à **30:00** sur fond bleu ciel; à **10:00 restantes**, le fond devient gris et indique la portion facultative. Il peut s’arrêter selon son état dès 20 minutes. À zéro, le chrono continue vers le haut en gris jusqu’à **Stop · résumé**, comme les autres jogs. La pause et la reprise ne comptent pas le temps de pause.

Les strides des samedis **7 et 14 durent 20 secondes**. Le jog du 7 dure **40 minutes**, celui du 14 **40 minutes**. Elles sont incluses dans le compte à rebours du jog. L’objectif reste six, avec des déclenchements supplémentaires permis. Aucun stride n’est lancé automatiquement. L’activation confirmée du 20 conserve exactement ses étapes et ses 20 minutes.

## Lancer et vérifier

Node.js 22 ou plus récent. Aucune installation nécessaire pour le serveur local ou les tests du moteur.

```sh
npm start                 # http://127.0.0.1:4173
npm test                  # moteur et calendrier
npm run check             # validation des données et du cache
npm run build             # fichiers autonomes dans dist/
```

Pour les essais automatisés Chromium, dans un second terminal pendant que le serveur tourne :

```sh
npm ci
npx playwright install chromium
npm run test:browser
npm run test:mobile
npm run test:update
```

Un Chromium existant peut être choisi avec `CHROMIUM_PATH=/chemin/vers/chrome npm run test:browser`. Les captures vont dans `test-results/` (non versionné). Les tests utilisent des profils temporaires; ils ne touchent pas au suivi réel du navigateur de Remy.

## GitHub Pages

Adresse du site : **https://mixmasterkd.github.io/Remy/**. Le [guide GitHub Pages](docs/github-pages.md) explique le mode **Deploy from a branch → main → / (root)**. Le dépôt contient directement `index.html` et ses ressources, sans étape de compilation obligatoire. Le dépôt a été rendu public avec l’accord d’Eric. Chaque commit poussé sur `main` déclenche une mise à jour du site.

## Modifier les séances par commit

Tout le calendrier est dans [`schedule.json`](schedule.json). Voir le [guide de modification](docs/seances.md). Après toute modification des fichiers du site :

```sh
npm run prepare:offline
npm test
npm run check
git add schedule.json sw.js index.html mise-a-jour.html
git commit -m "Précise la séance du 10 novembre"
```

`prepare:offline` génère une identité cohérente pour le HTML et le cache, d’après les fichiers et le service worker. `check` refuse une version périmée. La mise à jour télécharge tous les fichiers avant de s’activer et contourne les anciennes réponses du cache HTTP.

Le calendrier s’actualise automatiquement lorsque la nouvelle version est prête. Un chrono affiché reste sur sa version jusqu’au retour à la fiche. Les prochaines vérifications se font à l’ouverture, au retour sur la page, au retour du réseau et chaque minute lorsque la page est visible. Les coches ne sont jamais effacées par une mise à jour.

Si une ancienne installation reste affichée, ouvrir **[Actualiser Remy](https://mixmasterkd.github.io/Remy/mise-a-jour.html)** avec une connexion. Ce lien conserve les données et retourne au calendrier. Ne pas effacer les données de Chrome pour mettre à jour le site. Une ancienne page de chrono qui ne connaît pas encore ce mécanisme doit d’abord être arrêtée ou mise en pause, puis rechargée. Une séance dont la prescription a changé ne reprend pas un ancien chrono incompatible; un message l’explique. Une mise à jour nécessite une connexion et ne peut pas être imposée à un téléphone resté hors ligne.

## Structure

- `schedule.json` : séances confirmées et journées ouvertes.
- `engine.js` : moteur pur, temps en millisecondes, phases compilées.
- `app.js` : calendrier, suivi local, commandes, audio et API du téléphone.
- `style.css` : identité visuelle indépendante, calendrier et vues du chrono.
- `sw.js` : cache atomique de la version courante.
- `tests/` : tests de séquence et parcours Chromium.
- `docs/verification.md` : vérifications réalisées et limites.

Le moteur utilise `Date.now()` et des écarts d’horodatages; le rafraîchissement de l’écran n’est pas l’horloge. Il rattrape plusieurs étapes chronométrées après un retard et s’arrête sur les étapes ouvertes. Un changement manuel de l’heure du téléphone peut affecter le calcul : les sauts négatifs sont neutralisés, mais les sauts positifs restent indistinguables d’un temps réellement écoulé.

Références des limites des API : [Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [Fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API), [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
