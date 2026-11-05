# Publication ultérieure sur GitHub Pages

Adresse prévue : `https://mixmasterkd.github.io/Remy/`. Elle n’est pas activée par cette refonte. Le dépôt reste privé; aucune configuration Pages ni visibilité n’a été changée.

## Fichiers à servir

Le site complet est dans `public/` : `index.html`, scripts, feuille de style, données, icônes et service worker. `npm run build` copie ces fichiers dans `dist/` et ajoute `.nojekyll`. Les tests et la documentation ne sont pas inclus dans le site livré.

Tous les chemins du site sont relatifs (`./style.css`, `./app.js`, `./schedule.json`, `./sw.js`). Le manifeste utilise `start_url: "./"`, `scope: "./"` et `id: "./"`. Le service worker et son cache restent dans le sous-chemin du projet. La navigation par `#jour=...` ou `#chrono=...` ne demande aucune réécriture serveur.

## Mode prévu : GitHub Actions, lancement manuel

GitHub Pages en mode « Deploy from a branch » ne propose que la racine `/` ou `/docs`, pas `/public`. Le dossier `docs/` de ce dépôt contient la documentation, pas le site. Il ne faut donc pas sélectionner `main /docs` ou `main /(root)` avec l’arbre actuel.

Le modèle [pages-manuel.yml](pages-manuel.yml) prépare la publication des seuls fichiers de `dist/`. Il reste **inactif dans `docs/`**. Quand Eric décide de publier lui-même :

1. Vérifier que le plan GitHub permet Pages pour ce dépôt privé.
2. Copier ce modèle dans `.github/workflows/pages.yml` et commiter ce fichier.
3. Dans **Settings → Pages → Source**, choisir **GitHub Actions**.
4. Dans **Actions → Publier Remy manuellement**, lancer **Run workflow** sur `main`.

Le modèle ne contient aucun déclenchement sur `push`. Les mises à jour suivantes demandent également un lancement manuel. Le site Pages sera accessible sur Internet même si son dépôt source demeure privé; cette publication reste une décision distincte d’Eric.

GitHub Free permet Pages depuis un dépôt public; Pages depuis un dépôt privé nécessite un plan compatible, notamment Pro ou Team. Aucun changement de plan ni de visibilité n’est effectué ici. Sources : [sources de publication et visibilité](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [workflows Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Vérifier localement le même sous-chemin

```sh
npm run build
BASE_PATH=/Remy SITE_DIR=dist PORT=4185 npm start
```

Puis ouvrir `http://127.0.0.1:4185/Remy/`. Dans un second terminal, `TEST_URL=http://127.0.0.1:4185/Remy npm run test:browser` vérifie les mêmes parcours sous ce préfixe, y compris le rechargement hors ligne.
