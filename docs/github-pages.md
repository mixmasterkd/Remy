# GitHub Pages depuis la racine

Adresse prévue : `https://mixmasterkd.github.io/Remy/`. `index.html` et toutes ses ressources sont directement à la racine du dépôt. Le site est statique et ne demande aucune compilation pour la publication depuis une branche.

## Mode prévu : main / (root)

Lorsque la disponibilité de Pages sera débloquée :

1. Dans **Settings → Pages → Build and deployment → Source**, choisir **Deploy from a branch**.
2. Sélectionner **main**, puis **/ (root)** et enregistrer.
3. Attendre le succès du déploiement Pages avant de vérifier l’adresse du site.

Dans ce mode, chaque commit poussé sur `main` déclenche une mise à jour du site. `_config.yml` exclut la documentation, les tests et les outils du site publié. Il ne faut pas ajouter `.nojekyll` à la racine, car cela désactiverait ces exclusions. Le code du site ne dépend pas de Jekyll; GitHub utilise simplement sa construction intégrée pour appliquer les exclusions.

Les chemins du HTML, du manifeste, du calendrier et du service worker sont relatifs. Le manifeste utilise `start_url: "./"`, `scope: "./"` et `id: "./"`. La navigation par `#jour=...` et `#chrono=...` fonctionne dans `/Remy/` sans réécriture serveur.

## Blocage de publication vérifié

Le 5 novembre 2026, GitHub a refusé l’activation de Pages pour ce dépôt privé avec HTTP 422 :

> Your current plan does not support GitHub Pages for this repository.

Le dépôt demeure privé, sans Pages, et l’adresse prévue retourne HTTP 404. Déplacer `index.html` à la racine ne change pas la disponibilité du service. Pour poursuivre, Eric doit autoriser le passage du dépôt entier en public, avec son historique, ou choisir un plan GitHub compatible avec Pages pour un dépôt privé. Aucun changement de visibilité, de plan ou d’accès n’est fait ici.

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
