# Logo et icônes de Remy

Le PNG approuvé par Eric est conservé intact dans `logo-approuve.png`. Son empreinte SHA-256 et les paramètres de cadrage sont consignés dans `logo-renditions.json`. Les rendus sont des redimensionnements techniques du portrait, sans redessin ni retouche du visage.

## Fichiers utilisés

- `logo-remy-128.png` : PNG transparent, affiché à 32 px près du nom dans le calendrier.
- `icon-remy-v1-192.png` et `icon-remy-v1-512.png` : icônes transparentes, usage `any`.
- `icon-remy-maskable-v1-192.png` et `icon-remy-maskable-v1-512.png` : fond opaque assorti au site, usage `maskable`.
- `favicon-remy-v1-32.png` et `favicon-remy-v1-64.png` : icônes d’onglet sur fond clair.

Les versions adaptatives placent la silhouette visible dans un cercle de rayon 38 % de l’icône, à l’intérieur des 40 % garantis par les masques. Les pixels presque transparents du fichier source ne servent pas à déterminer le cadrage; le fichier original reste inchangé. Le rendu conserve le portrait et ses épaules. Les petites tailles et plusieurs formes sont contrôlées dans [la planche d’aperçu](apercu-icones.png). [Référence des icônes adaptatives](https://web.dev/articles/maskable-icon).

## Application déjà installée

Le logo de la page suit la mise à jour du site et du service worker. L’icône du lanceur Android dépend aussi de Chrome et du type d’installation; elle peut donc rester ancienne alors que le calendrier affiche déjà le nouveau portrait.

La documentation Chrome 144 indique qu’une modification importante du nom ou de l’icône peut demander une validation de l’utilisateur. Elle précise aussi qu’un fichier d’icône modifié doit avoir une nouvelle adresse ou de nouvelles métadonnées pour être détecté. Les nouvelles adresses `v1` répondent à ce point; `id`, `start_url`, `scope`, `name`, `short_name` et l’adresse de `manifest.webmanifest` sont conservés. [Comportement Chrome documenté en janvier 2026](https://developer.chrome.com/blog/improvements-to-web-app-updates).

Après publication, ouvrir l’application avec une connexion et suivre une éventuelle proposition de mise à jour de l’icône. L’acceptation, le délai et l’apparence finale restent à vérifier sur les Galaxy réels. Aucune mise à jour de lanceur n’est prétendue à partir d’un test Chromium sur ordinateur. Ne pas effacer les données de Chrome pour forcer l’icône : cela peut effacer le suivi. La disponibilité hors ligne et les coches ne nécessitent pas de réinstallation.

## Régénération et contrôle

```sh
npm run prepare:icons
npm run prepare:offline
npm test
npm run check
npm run build
npm run test:icons
```

`prepare:icons` utilise Chromium et la source approuvée; fournir `CHROMIUM_PATH` au besoin. Le cache inclut tous les nouveaux rendus. Les anciens fichiers d’icône sont conservés pour les versions historiques en cache. Pour un futur changement de dessin, utiliser de nouvelles adresses d’icône et adapter les références, le manifeste et le cache ensemble.
