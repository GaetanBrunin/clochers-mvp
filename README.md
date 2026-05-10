# Clochers MVP

MVP mobile pour recenser les églises, afficher une carte, marquer les visites et faire une chasse aux détails.

## Lancement

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée par Vite.

## Important

Cette version est volontairement figée sur Vite 5 / React 18 pour fonctionner avec Node 20.13.1.

Les données personnelles sont stockées dans `localStorage` : visites, favoris, défis terminés, anecdote personnelle.

## Où modifier les églises ?

Fichier :

```text
src/data/churches.ts
```
