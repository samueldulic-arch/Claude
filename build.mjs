/*
 * Baut aus index.html + css + js eine einzige HTML-Datei.
 *
 *   node build.mjs
 *
 * Ergebnis:
 *   dist/duemmste-fliegt.html  – komplette Einzeldatei zum Verschicken/Offline-Spielen
 *   dist/inhalt.html           – nur der Seiteninhalt (für Umgebungen, die den
 *                                HTML-Rahmen selbst mitbringen)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const lies = p => readFileSync(new URL(p, import.meta.url), 'utf8');

const css    = lies('./css/style.css');
const fragen = lies('./js/fragen.js');
const app    = lies('./js/app.js');

const titel = 'Der Dümmste fliegt';

const inhalt = `<title>${titel}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
${css}
</style>

<main class="wrap" id="app"></main>

<script>
${fragen}
</script>
<script>
${app}
</script>
`;

const komplett = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0a1f">
${inhalt}</body>
</html>
`.replace('<main class="wrap" id="app"></main>', '</head>\n<body>\n<main class="wrap" id="app"></main>');

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/duemmste-fliegt.html', import.meta.url), komplett);
writeFileSync(new URL('./dist/inhalt.html', import.meta.url), inhalt);

console.log('dist/duemmste-fliegt.html geschrieben (' + Math.round(komplett.length / 1024) + ' KB)');
console.log('dist/inhalt.html geschrieben');
