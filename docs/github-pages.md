# GitHub Pages depuis la racine

Adresse du site : `https://mixmasterkd.github.io/Remy/`. `index.html` et toutes ses ressources sont directement à la racine du dépôt. Le site est statique et ne demande aucune compilation pour la publication depuis une branche.

## Mode actif : main / (root)

Configuration appliquée :

1. Dans **Settings → Pages → Build and deployment → Source**, choisir **Deploy from a branch**.
2. Sélectionner **main**, puis **/ (root)** et enregistrer.
3. Attendre le succès du déploiement Pages avant de vérifier l’adresse du site.

Dans ce mode, chaque commit poussé sur `main` déclenche une mise à jour du site. `_config.yml` exclut la documentation, les tests et les outils du site publié. Il ne faut pas ajouter `.nojekyll` à la racine, car cela désactiverait ces exclusions. Le code du site ne dépend pas de Jekyll; GitHub utilise simplement sa construction intégrée pour appliquer les exclusions.

Les chemins du HTML, du manifeste, du calendrier et du service worker sont relatifs. Le manifeste utilise `start_url: "./"`, `scope: "./"` et `id: "./"`. La navigation par `#jour=...` et `#chrono=...` fonctionne dans `/Remy/` sans réécriture serveur.

## Visibilité autorisée et blocage résolu

Le 5 novembre 2026, GitHub a refusé l’activation de Pages pour ce dépôt privé avec HTTP 422 :

> Your current plan does not support GitHub Pages for this repository.

Eric a ensuite explicitement autorisé le passage de `mixmasterkd/Remy` en public, avec son code, son calendrier, ses captures et son historique. Après vérification du contenu, ce seul dépôt a été rendu public et Pages activé sur `main / (root)`. HTTPS est imposé. Aucun autre dépôt, plan ou accès n’a été modifié. Le dépôt et son historique sont maintenant consultables publiquement; les exclusions de `_config.yml` concernent seulement le site Pages.

## Aperçu local

```sh
BASE_PATH=/Remy PORT=4185 npm start
```

Ouvrir `http://127.0.0.1:4185/Remy/`. Dans un second terminal :

```sh
TEST_URL=http://127.0.0.1:4185/Remy npm run test:browser
```

Le serveur local sert uniquement les fichiers du site, même si sa source est maintenant la racine du dépôt.

## Export facultatif

`npm run build` copie uniquement les fichiers du site dans `dist/` et y ajoute `.nojekyll`. Cet export reste disponible pour un hébergement statique ou un workflow personnalisé. Le modèle alternatif [pages-manuel.yml](pages-manuel.yml) reste inactif dans `docs/`; il n’est pas nécessaire pour le mode `main / (root)`.

Sources : [choisir la source Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [exclusions Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll), [disponibilité selon le plan](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
