# Vérification du 5 novembre 2026 — ajustements Galaxy

Version adaptée après l’essai d’Eric sur Galaxy. Vérifications de cette nouvelle version sur Pop!_OS 24.04, Node.js 24.19, Playwright 1.62.1 et Chromium 153.0.8010.12. Les événements tactiles sont simulés par Chromium; aucun nouvel essai physique sur le téléphone n’est prétendu.

## Résultats

- **33 tests moteur** : calendrier continu du 5 au 21; prescriptions séparées des 5, 7 et 14; 24 minutes d’effort le 9, 20 le 11, activation de 20 minutes inchangée; échauffements ouverts; pause interblocs libre; pause/reprise; retards d’horodatages; arrêt explicite; temps supplémentaire; strides au-delà de six; distinction lancés/complétés/interrompus; reprise de deux chronos sauvegardés; total réel par phase.
- **25 parcours navigateur** : calendrier et fiches, suivi local, sous-chemin `/Remy/`, six tailles de fenêtre de 320 à 1 440 px, verrouillage et annulations d’appui, clavier, navigation protégée, phases, vue paysage, activation, rechargement hors ligne, refus des API plein écran/écran éveillé, stockage indisponible et reprise après arrière-plan.
- **24 parcours mobiles avec événements tactiles Chromium** : grandes cases carrées à 412×915, recommandations et graphique du lundi, maintiens de 3 s indépendants du verrouillage, annulation à 2 999 ms/au déplacement/à l’interruption, maintiens de 1 s, double affichage, pause/reprise/rechargement d’un stride, septième stride autorisé, deux variations légères de luminosité, résumé d’un stride interrompu, temps supplémentaire et franchissement de zéro pendant un stride.
- Données et cache vérifiés avec `npm run check`; export `dist/` vérifié avec `npm run build`. Les durées d’effort/récupération et la séquence de l’activation du 20 ne changent pas.

Captures : [calendrier](apercu-mobile.png), [fiche du 9](apercu-fiche.png), [chrono](apercu-chrono.png), [échauffement](apercu-echauffement.png), [stride](apercu-stride.png), [résumé](apercu-resume.png), [bureau](apercu-bureau.png). Les coches et totaux des captures appartiennent seulement aux profils de test.

## Comportements précisés

Le 5 lance un jog de 30 minutes; le 7 un jog de 40 minutes avec objectif de six strides de 20 secondes. Le 14 conserve désormais 40 minutes et six strides de 20 secondes, précédées de l’échauffement libre demandé. Les séances futures avec répétitions reçoivent aussi un échauffement libre; l’activation du 20 conserve explicitement sa séquence existante.

Le maintien de 3 secondes démarre les intervalles ou le bloc suivant sans déverrouiller les autres commandes. Le maintien de 1 seconde lance un stride même quand les commandes sont verrouillées. Pause et Stop demandent le déverrouillage habituel. Le compteur « strides effectués » compte les déclenchements; le résumé sépare les strides lancés, complétés et interrompus.

À zéro, le jog devient gris et continue vers le haut jusqu’à Stop. Un stride déjà lancé conserve son second chrono jusqu’à sa fin; le fond reste gris en temps supplémentaire. Aucun nouveau stride ne peut être lancé après le compte à rebours du jog. Les deux variations de luminosité durent deux secondes au total, sans clignotement rapide, et respectent la préférence de réduction des animations.

Les instantanés d’anciens chronos devenus incompatibles sont écartés avec un message explicite. Le suivi des séances faites conserve sa clé de stockage et n’est pas réinitialisé.

## Correction des strides et migration du cache

Correction confirmée par Eric : le 7 reste à 40 minutes, le 14 est maintenant à 40 minutes; les deux ont six strides de 20 secondes. Le moteur et les fiches lisent ces mêmes données; depuis le 6 novembre, les graphiques masquent les strides à la demande d’Eric. Aucune autre prescription n’est modifiée.

Le défaut de cache a été reproduit : avec le commit `6ab5284` actif et `8755ed8` en attente, recharger ne suffit pas; l’ancien calendrier de 15 cases reste affiché. Le service worker servait les anciens fichiers en priorité et attendait la fermeture de toutes les fenêtres pour activer la nouvelle version. Références du mécanisme : [activation immédiate contrôlée](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting), [vérification des mises à jour](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update).

La nouvelle version télécharge un ensemble complet avec des requêtes propres à sa version, s’active sans attendre la fermeture de toutes les fenêtres, puis actualise le calendrier. Les pages modernes reportent le rechargement pendant un chrono. Les anciennes pages ne répondant pas au nouveau protocole sont actualisées seulement si elles ne montrent pas de chrono. Le lien `mise-a-jour.html` permet aussi de quitter une ancienne installation sans effacer les données locales. La version est indiquée dans les fiches.

**14 scénarios de migration réussis** simulent les deux anciens états, une mise à jour future avec chrono actif, une connexion coupée et un fichier manquant. Les coches et les chronos compatibles mis en pause sont conservés; une mise à jour incomplète laisse la version hors ligne précédente disponible. Les caches d’autres chemins et localStorage ne sont pas supprimés.

La nouvelle apparence est vérifiée après migration en fenêtres **360×800** et **412×915** : trois colonnes, cases carrées, noms des jours, mini-graphiques des 9 et 11, mois discret. Captures : [avant migration](migration-avant.png), [après, 360 px](migration-360.png), [après, 412 px](migration-412.png). Il s’agit de simulations Chromium, pas d’une observation du Galaxy d’Eric.

## Graphiques du 6 novembre 2026

Les strides sont retirés des graphiques du calendrier et des fiches, y compris ceux de l’activation du 20. Les jogs des 7 et 14 gardent une barre continue; leurs six strides de 20 secondes restent dans les descriptions et les chronos. Les graphiques d’intervalles utilisent les mêmes valeurs CSS que les fonds du chrono : effort vert, récupération courte rouge, pause interblocs bleu ciel; les phases faciles sont bleu ciel et les phases neutres, si représentées, grises. Aucune phase ni durée inconnue n’est ajoutée aux graphiques.

Le contenu des séances et le moteur restent identiques au commit `0f94bdd`; seul l’identifiant de révision du calendrier passe à `2026-11-06.1`. Les essais tactiles comparent les couleurs calculées des graphiques aux fonds du chrono lors des efforts et récupérations. Les migrations incluent la version publiée `0f94bdd` et vérifient les nouvelles barres, les couleurs et la conservation des coches. Les captures mobiles sont des simulations Chromium, pas des essais physiques sur Galaxy.

## Calendrier et consignes du 6 novembre 2026

Repos confirmés les 6, 13, 15 et 19. Le 8 propose 15 min très faciles ou repos si jambes lourdes; le 17, 15 min très faciles confirmées. Le 12 a ensuite été confirmé comme jog très léger de 20–30 min.

Le 10 propose 20–30 min en Z1 : compte à rebours initial 30:00, bleu ciel jusqu’à 20 min écoulées, puis gris avec 10:00 restantes. Arrêt possible après 20 min; les dix dernières sont facultatives. À zéro, temps supplémentaire ascendant gris jusqu’à Stop. Les tests couvrent le seuil exact, la pause/reprise, le rechargement, l’arrêt anticipé et le résumé.

Le 16 conseille 10 min d’échauffement libre, 3 efforts de 2 min à effort 5 km avec seulement deux récupérations de 1 min très facile, puis 5 min de retour au calme libre. Total indicatif 23 min. Les tests vérifient le départ manuel, les trois efforts, les deux récupérations et le retour manuel.

Les fiches des 7 et 14 expliquent sous Strides la répartition libre, la progression sans sprint, le maintien de « Stride · 20 s » une seconde et la récupération jusqu’à respiration régulière. Le 18, marqué facultatif, reprend le même fonctionnement pour 20 min très faciles et 4 strides de 10 s, avec guide adapté et compteur sans plafond. Les essais atteignent 5/4 sans arrêter le jog. Le 11 présente plus clairement son échauffement/retour libres et ses dix efforts avec neuf récupérations. Le programme du 11, le contenu du 9 et l’activation du 20 sont inchangés.

Le jour courant utilise `America/Toronto`, avec son encadré conservé, une date en relief et `aria-current="date"`. Les jours passés sont légèrement estompés, jamais désactivés. Le repère se met à jour chaque minute et au retour sur la page, sans perdre le focus ni les coches. Les tests simulent minuit à Toronto dans des navigateurs réglés sur Tokyo et Los Angeles et exécutent une séance passée.

Les migrations incluent le commit publié `cbb32c4` avec conservation des coches. Révision de ce lot : `2026-11-06.3`. Les captures et les gestes tactiles proviennent de Chromium, sans essai physique sur Galaxy. [Capture du jour courant](jour-courant-toronto.png), [guide des strides du 7](fiche-strides-7.png), [fiche du 11](fiche-intervalles-11.png), [fiche du 16](fiche-intervalles-16.png), [séance facultative du 18](fiche-facultative-18.png), [dix minutes facultatives du 10](chrono-facultatif-10.png).

## Ajout du jeudi 12 novembre

La demande corrigée d’Eric est un jog très léger de **20 à 30 minutes**. Seule cette journée change, avec la révision `2026-11-06.4`. Le fonctionnement existant du 10 est réutilisé : départ à 30:00, bleu ciel pendant 20 minutes, gris dès 10:00 restantes pour la portion facultative, puis temps supplémentaire ascendant à zéro. Stop termine et affiche le résumé; pause/reprise et rechargement conservent le temps actif. Aucune zone supplémentaire n’est imposée.

Les parcours tactiles vérifient ces transitions, l’arrêt après 20 minutes et la reprise du 12; les migrations incluent la version publiée `49b6653` et conservent les coches. Les autres journées et le code du chrono restent identiques. [Capture de la fiche du 12](fiche-jog-12.png).

## Repos le vendredi 13 novembre

À la demande d’Eric, le jog du 13 est remplacé par une journée de repos confirmée. Sa case et sa fiche utilisent le même libellé et le même style pâle que les autres repos, sans bouton de chrono. Le 14 passe à 40 minutes avec ses six strides de 20 secondes; ses textes et son chrono sont adaptés. Les cases des 7, 14, 18 et 20 affichent « strides », sans ajout dans les graphiques. Toutes les autres prescriptions restent identiques. Révision : `2026-11-06.5`.

La migration depuis `17b5d7b` vérifie le remplacement du jog, le maintien des coches et l’ouverture d’un ancien lien de chrono du 13 sur la fiche Repos, sans lancer de séance. Un ancien chrono du 14 est reconnu comme incompatible et repart au début avec un avis explicite; sa coche est conservée. Les 13 scénarios de migration couvrent ces deux changements. Les libellés restent lisibles de 320 à 1 440 px sans débordement horizontal ou vertical; les marges sont adaptées entre 601 et 900 px. Captures : [repos du 13](fiche-repos-13.png), [40 minutes du 14](fiche-strides-14.png).

## Totaux et récupérations marchées

Publication explicitement autorisée après la demande initiale de préparation seule. Les données publiées ne définissent aucune durée pour la pause interblocs du 9 : elle reste à confirmer, avec la consigne marche ou jog très lent. Les récupérations courtes des 9, 11 et 16 sont indiquées comme marchées dans les fiches et les chronos.

- Le 9 : 24 min d’effort + 12 min de récupération marchée + 10–15 min d’échauffement + 5–10 min de retour = **51–61 min, plus la pause entre blocs non définie**.
- Le 11 : 20 min d’effort + 9 min de récupération marchée = **29 min, plus échauffement et retour au calme non définis**.
- Le 16 : 10 min d’échauffement conseillées + 6 min d’effort + 2 min de marche + 5 min de retour conseillées = **23 min conseillées**.

Les plages numériques sont contrôlées contre leurs libellés. Les phases du chrono restent exactement identiques et manuelles là où elles l’étaient; les nouvelles consignes sont hors de la signature du programme pour conserver une séance sauvegardée compatible. Une migration supplémentaire depuis `627ae95` vérifie qu’une récupération du 9 mise en pause reprend au même temps avec « Marche » et sa coche conservée. Révision : `2026-11-06.6`.

À cette étape, la pause interblocs du 9 et les plages du 11 étaient laissées ouvertes. La vérification de l’appel ci-dessous résout les plages du 11; la pause du 9 reste à confirmer.

## Recommandations du mercredi 11 rétablies

La relecture de l’appel confirme la demande d’Eric de reprendre les descriptions d’échauffement et de retour au calme du lundi 9, sans modifier les intervalles du mercredi. La fiche du 11 reprend donc **10–15 min d’échauffement** et **5–10 min de retour au calme**, conseillées et toujours en chrono libre. Son total prévu devient **44–54 min** : 10–15 + 20 min d’effort + 9 min de marche + 5–10. Les dix efforts de 2 min et les neuf récupérations de 1 min sont inchangés. Révision : `2026-11-06.7`.

Seules ces recommandations du 11 changent dans le programme. Tous les objets `workout` restent identiques à `ba04a7c`, donc les chronos sauvegardés restent compatibles. Le 9 reste à **51–61 min + pause interblocs à confirmer**; aucune durée n’a été attribuée à cette pause.

Vérifications locales : **33 tests du moteur, 25 parcours navigateur, 24 parcours mobiles et 14 migrations réussis**; données, cache, compilation statique et diff contrôlés. La migration depuis `ba04a7c` vérifie le passage du total du 11 de « 29 min + étapes libres » à « 44–54 min prévues », tout en conservant sa coche et sa récupération mise en pause au même temps. Affichage contrôlé dans Chromium, notamment aux formats 360×800 et 412×915, sans prétendre à un essai matériel Galaxy. [Fiche corrigée du 11](fiche-11-plages.png).

## Marche interblocs et références finales des 9 et 11

Eric confirme **4 minutes de marche entre les blocs du 9**, puis fixe les références des deux séances à **10 min d’échauffement et 8 min de retour au calme**, toujours en chrono libre. Cette décision remplace les plages précédentes et la pause non définie. Les cases affichent simplement **58 min le 9** et **47 min le 11**, sans « + pause ». Révision : `2026-11-06.8`.

- Le 9 : 10 + 24 min d’effort + six récupérations de 2 min + une marche interblocs de 4 min + 8 = **58 min**. Il n’y a aucune récupération de 2 min supplémentaire avant ou après cette marche.
- Le 11 : 10 + 20 min d’effort + neuf récupérations de 1 min + 8 = **47 min**. Ses phases d’effort et de récupération sont inchangées.

La barre bleu ciel entre les deux blocs est proportionnée aux 4 minutes et accompagnée d’un libellé « 4 min · Marche entre les blocs ». Le chrono affiche « Marche », décompte 04:00 en bleu ciel, puis commence directement le premier effort du deuxième bloc. L’indication de départ manuel, qui ne concerne plus cette pause, n’y apparaît plus. L’échauffement et le retour au calme des deux séances restent ascendants et manuels : leur temps réel peut donc différer des références affichées.

**34 tests du moteur, 25 parcours navigateur, 24 parcours mobiles et 15 migrations réussis.** Les essais vérifient la frontière exacte à zéro, le passage direct d’effort à marche puis effort, pause/reprise, rechargement, récapitulatif 24+12+4, navigation, gestes tactiles, sous-chemin `/Remy/` et mode hors ligne. La migration depuis `04c5fcd` garde les coches et le chrono compatible du 11. L’ancien chrono du 9, incompatible avec sa pause désormais chronométrée, repart du début avec un avis explicite; une page de chrono active n’est pas rechargée pendant la mise à jour. Le nouveau test installe son horloge simulée avant de recharger l’application pour contrôler ses intervalles de rafraîchissement.

Contrôles visuels dans Chromium, sans essai matériel Galaxy : [fiche du 9](fiche-9-marche-4min.png), [marche de 4 min](chrono-9-marche-4min.png), [fiche du 11](fiche-11-reference-47min.png). Les autres prescriptions, notamment l’activation du 20, sont conservées.

## Légendes des efforts et récupérations

À partir de la capture appréciée par Eric, les fiches reprennent le même petit trait coloré, suivi de la durée et d’un libellé court. Le 9 affiche **3 min · Effort**, **2 min · Marche entre les efforts** et **4 min · Marche entre les blocs**. Le 11 affiche **2 min · Effort** et **1 min · Marche entre les efforts**; le 16, **2 min · Effort 5 km** et **1 min · Marche très facile entre les efforts**. L’activation du 20 décrit ses phases effectivement dessinées, dont les récupérations de **40 s**. Les strides restent dans les descriptions et les chronos, sans réapparition dans le graphique ou sa légende.

Les légendes sont dérivées des phases existantes, sans durées inventées et sans répétition inutile d’un libellé identique. Leurs couleurs utilisent les mêmes variables que le chrono : vert pour l’effort, rouge pour la récupération courte, bleu ciel pour la marche interblocs et les étapes faciles. Toutes les prescriptions et le moteur sont identiques au commit `ff6a1f3`; seule la révision des données passe à `2026-11-06.9`.

**34 tests du moteur, 25 parcours navigateur, 25 parcours mobiles et 16 migrations réussis.** Contrôles des quatre légendes à **360×800 et 412×915**, sans débordement horizontal, et comparaison exacte des couleurs et durées. Les migrations depuis la version publiée `ff6a1f3` conservent les coches et les récupérations mises en pause des 9 et 11, sans redémarrage du chrono. Les essais de séquence, pause/reprise, appuis longs, navigation et fonctionnement hors ligne passent également.

Captures Chromium, sans prétendre à un test matériel Galaxy : [9 novembre](legende-9-360.png), [11 novembre](legende-11-412.png), [16 novembre](legende-16-360.png), [20 novembre](legende-20-412.png).

## Logo approuvé et icônes Android

Le portrait approuvé par Eric est intégré discrètement à l’en-tête et décliné en icônes Android transparentes et adaptatives 192/512 px, ainsi qu’en icônes d’onglet 32/64 px. Le PNG source est conservé à l’identique, vérifié par SHA-256. Les versions adaptatives sont opaques et leur silhouette visible respecte la zone circulaire protégée; les versions ordinaires gardent la transparence. L’identité, les noms, les chemins de lancement et le chemin du manifeste restent inchangés. Les nouvelles adresses d’icône permettent à Chrome de détecter cette évolution.

Publication explicitement autorisée après la première demande de préparation locale seule. Les données de séance, `engine.js` et `app.js` sont identiques au commit `1b05e33`. Le cache est renouvelé avec les sept nouveaux rendus; les anciens fichiers d’icône restent disponibles pour les versions historiques.

**34 tests du moteur, 25 parcours navigateur, 25 parcours mobiles, 16 migrations et 6 contrôles d’icône réussis.** Vérifications des dimensions, transparence/opacité, marge protégée et chemins `/Remy/`; affichage à 320, 360 et 412 px; cache hors ligne des icônes et du logo. Les migrations depuis `1b05e33` conservent les coches et les chronos mis en pause des 9 et 11. Les transitions, appuis longs et séances restent inchangés.

[Calendrier à 412 px](calendrier-logo-412.png), [calendrier à 320 px](calendrier-logo-320.png), [formes d’icône simulées](apercu-icones.png). Ces contrôles ne prouvent pas une mise à jour du lanceur sur un Galaxy physique. Le délai et l’éventuelle validation de l’icône par Chrome sont expliqués dans [le guide du logo](logo.md).

## Référence GBoxeur et revue Astra

Référence lue uniquement pour le comportement du chrono dans `mixmasterkd/gestionboxeur`, commit `cef8a67016bf94d9aa710cac12519613b4d31abf` : `js/timer-session.js`, `js/session-timer.js`, `js/session-timer-engine.js` et `js/timer-interval-controls.js`. Le dépôt de référence était propre et l’est resté.

GBoxeur verrouille au départ, déverrouille par un maintien de 3 s et gère les interruptions du geste. Remy reprend ces principes dans une réalisation indépendante, avec une identité visuelle originale. Remy utilise aussi un maintien de 3 s pour verrouiller manuellement. Les phases inconnues restent manuelles. Le chrono de Remy continue selon les horodatages pendant l’absence de la page, contrairement à une pause forcée à sa fermeture.

**Modèles :** l’agent de revue a été explicitement lancé avec `gpt-6-astra`. Il a examiné la référence puis relu le moteur et les interactions de Remy. La réalisation principale a été faite par la tâche Codex principale; son identifiant de modèle exact n’est pas exposé par l’environnement. Il n’est donc pas affirmé que le site a été réalisé par Astra. La revue a identifié trois cas limites (fin en arrière-plan encore verrouillée, acquisition du maintien éveillé interrompue, fin avant démarrage); ils ont été corrigés et couverts par les essais ci-dessus.

La recherche de contexte personnel connecté n’était pas disponible dans cette conversation. Les consignes locales accessibles ont été vérifiées; le fichier global AGENTS.md était vide. Les décisions explicites d’Eric dans la délégation et ses précisions ultérieures ont servi de référence. L’historique utilisateur original a ensuite été lu directement pour vérifier l’autorisation GitHub.

## État de livraison

Le projet est commité localement et envoyé dans [mixmasterkd/Remy](https://github.com/mixmasterkd/Remy), sur la branche `main`. Initialement privé, le dépôt est désormais public avec l’autorisation explicite d’Eric, donnée après explication que le code, le calendrier, les captures et l’historique seraient accessibles à tous. GitHub a confirmé `visibility: public`, `private: false`, puis Pages sur `main / (root)` à `https://mixmasterkd.github.io/Remy/`, avec HTTPS imposé.

La création avait initialement été bloquée par le contrôle automatique. Eric a ensuite donné son feu vert explicite pour créer ce dépôt privé et y envoyer le code, le calendrier et les captures. L’absence du dépôt a été vérifiée de nouveau avant la création, puis l’opération a réussi. GitHub CLI 2.103.3, copie temporaire officielle vérifiée par SHA-256, a utilisé la connexion existante du compte `mixmasterkd`; aucune configuration d’authentification n’a été changée.

Avant le changement de visibilité, les cinq commits et leurs fichiers ont été vérifiés : 57 versions de fichiers texte et 11 versions binaires, limitées au site, aux icônes, aux captures, aux tests et à la documentation. Aucun motif de clé privée, de jeton GitHub/AWS ou d’affectation de secret n’a été détecté. Cette recherche ciblée ne constitue pas une garantie exhaustive. Aucune configuration d’authentification, aucun autre dépôt et aucun serveur CyberAS n’ont été modifiés.

Un aperçu local a également été lancé à la demande d’Eric sur `http://127.0.0.1:4173/Remy/`, puis vérifié dans le navigateur intégré. Cette adresse concerne seulement le Pop!_OS qui exécute le serveur; elle n’est pas une adresse hébergée pour le téléphone de Remy.

## Limites et décisions restantes

- Essai réel à faire avec Eric sur Galaxy S25 et avec Remy sur son Android : installation depuis Chrome, visibilité en extérieur, sons, comportement Android en veille, plein écran et maintien éveillé. Aucun test matériel n’est prétendu.
- En arrière-plan ou écran verrouillé, l’OS peut suspendre le code et l’audio. Les horodatages permettent de retrouver le temps, mais ne garantissent pas les alertes à l’instant voulu. Les tests simulent les retards et les transitions de visibilité; ils ne reproduisent pas toutes les politiques d’économie d’énergie Android.
- L’état local n’est pas synchronisé. Un cache supprimé, un stockage effacé, une autre adresse ou un autre navigateur peuvent faire perdre l’accès hors ligne ou le suivi.
- L’adresse du calendrier est `https://mixmasterkd.github.io/Remy/`. Voir [la configuration Pages](github-pages.md). Le suivi local de l’aperçu ne se transfère pas automatiquement vers cette nouvelle adresse. Aucune installation sur CyberAS.
- Jogs en Z1 et contenu des jours encore ouverts, échauffements/retours au calme manquants, horaire exact de course et ergonomie du bouton d’accélération restent à discuter. L’activation du **vendredi 20 est confirmée**.


## Gros caractères et chiffres en course (8 novembre 2026)

Le chrono principal utilise presque toute la largeur utile, avec chiffres gras et tabulaires; la taille s’adapte aussi aux comptes de trois ou quatre chiffres en minutes. À 360 px de large, la police passe d’environ 83 à 128 px (+54 %), le second chrono des strides de 38 à 81 px (+110 %). Les consignes principales des fiches passent à 16–18 px minimum. Les libellés du calendrier sont aussi agrandis. Les phases, les couleurs, les prescriptions, le moteur et les clés du stockage local restent inchangés.

Les petits écrans gardent les deux chronos et le déverrouillage dans la vue pendant un stride; les informations secondaires restent disponibles au déverrouillage. Les sections ne sont plus comprimées au risque de se chevaucher. Les fiches et les vues qui en ont besoin restent défilables verticalement.

Vérifications sur Chromium avec profils temporaires : 34 tests du moteur, 25 parcours navigateur, 25 parcours tactiles, 17 nouveaux scénarios de lisibilité et 16 migrations. Les nouveaux essais couvrent les 17 fiches à 320×568, 360×640, 412×915 et 800×360, les deux chronos, les caractères gras, les minutes à trois/quatre chiffres, les pauses, les résumés, l’absence de débordement horizontal et l’accès au déverrouillage. La migration depuis la version publiée du logo (`5ba75a7`) conserve les coches et les chronos compatibles mis en pause. Le cache et le build sont régénérés et contrôlés.

Les captures de test sont dans `test-results/readability-*.png` (non versionnées). Ces essais reproduisent des dimensions mobiles et les interactions tactiles; ils ne constituent pas un essai physique pendant une course sur Galaxy. La lisibilité réelle avec les secousses et en plein soleil reste à essayer par Remy.
