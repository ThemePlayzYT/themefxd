# THEMEFX

Minecraft editing animation library (React + Vite).

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Files

- `index.html` - entry page
- `main.jsx` - React entry
- `App.jsx` - all pages and components
- `data.js` - list of collections and animations
- `styles.css` - all styles
- `public/videos/` - 1080p previews (with sound)
- `public/posters/` - still frames
- `public/downloads/` - original 4K files for download
- `public/logo.png`, `public/favicon.png`

## Add an animation

1. Put a 1080p preview in `public/videos/` and a poster in `public/posters/`.
2. Put the original file in `public/downloads/`.
3. Add an entry in `data.js` with the same `collectionId` as its group.
