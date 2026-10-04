# BUGATTI CHIRON — Anatomy of Speed

A cinematic Next.js 14 scrollytelling experience built from the supplied Chiron frame sequence.

The source frames show driving and detail footage. At mid-scroll, they break into a deterministic 4×3 digital tile field and reassemble; this is a visual fragmentation effect, not a true 3D exploded-engine render.

## Local development

```bash
npm install
npm run dev
```

To reconvert the source images, restore the ignored `source-frames/hero/` folder and run:

```bash
npm run convert
```

The converter naturally sorts the detected PNG naming pattern, emits sequential WebP files to `public/hero-webp/`, samples the first source frame's top-left 10×10 background color, and keeps every other source frame when the input exceeds 200 frames. The prebuild hook skips conversion when the complete optimized sequence is already present.

## Build and deployment

`npm run build` creates the standard Next.js production build and applies one-year immutable caching to `/hero-webp/*`. For GitHub Pages, run `npm run build:pages`; it creates an export with the `/Bugatti_3d` base path. Publish the contents of `out/` to the `gh-pages` branch (for example, with `git subtree push --prefix out origin gh-pages`). GitHub Pages must use the `gh-pages` branch root as its source.
