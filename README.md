# Patrimoine du Cambrésis

Web app mobile-first pour recenser et faire découvrir le patrimoine du diocèse et
de la ville de Cambrai : **églises, abbayes, mais aussi statues, monuments,
bâtiments, rues et places** (pensée pour un partenariat ville / office de
tourisme). **Aucune base de données** : les données des sites sont statiques
(dans le code) et la progression du visiteur est stockée dans le `localStorage`
de son téléphone. Hébergeable gratuitement (GitHub Pages).

Chaque site porte une **catégorie** (qui adapte l'affichage : les messes
n'apparaissent que pour les lieux de culte, les horaires que si le lieu se
visite) et des éléments « À découvrir » qui peuvent être un **quiz** (QCM ou
champ libre) ou une simple **anecdote**, avec une coche « Trouvé / Vu ».

## Fonctionnalités

- **Liste** filtrable : recherche texte, tags, favoris, non visitées, tri
  « autour de moi » (géolocalisation à la demande).
- **Carte** interactive (Leaflet + OpenStreetMap, sans clé API).
- **Fiche église** riche : galerie photos, statut ouvert/fermé calculé depuis
  des horaires structurés, horaires des messes, itinéraire (Google Maps / App
  Plans / OpenStreetMap), accessibilité (PMR, parking, transports), partage.
  - onglet **Histoire** (fondation, texte, sources) ;
  - onglet **À découvrir** : éléments à trouver avec quiz (QCM ou champ libre)
    et coche « Trouvé ! » pour gamifier la visite.
- **Parcours** thématiques avec barre de progression.
- **Carnet** : statistiques, badges, export/import JSON de la progression.
- **PWA** installable et utilisable hors-ligne (service worker en production).

## Lancement

```bash
npm install
npm run dev      # serveur de dev Vite
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

Figé sur Vite 5 / React 18 pour fonctionner avec Node 20.13.1.

## Où modifier le contenu ?

- **Sites** (églises, statues, monuments…) : `src/data/sites.ts` (copier un bloc
  et adapter les champs ; seuls les champs de base sont obligatoires).
- **Catégories** disponibles : `src/types.ts` (`CATEGORY_META`).
- **Parcours** : `src/data/routes.ts`.
- **Photos** : déposer les images dans `public/photos/` et référencer
  `photos/mon-image.jpg` dans `coverImage` / `gallery` / `discover[].image`.
- **Badges** : `src/lib/badges.ts`.

## Structure

```text
src/
  types.ts              # modèle de données unifié (Site, catégories…)
  data/                 # sites + parcours (contenu statique)
  lib/                  # progression (localStorage), horaires, géo, badges
  hooks/                # useProgress, useGeolocation
  components/           # SiteList, MapView, SiteDetail, Quiz, etc.
  App.tsx               # navigation + assemblage
public/                 # manifest PWA, service worker, icônes
```

## Déploiement (GitHub Pages)

Le build se fait dans `dist/`. Voir la note « git » ci-dessous : la branche
`gh-pages` mélange aujourd'hui sources et build ; il est recommandé de garder les
sources sur `master` et de publier uniquement le contenu de `dist/` sur
`gh-pages` (par ex. via une action GitHub `actions/deploy-pages`).
