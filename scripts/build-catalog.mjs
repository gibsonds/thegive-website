import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

// tracks.js remains the source of truth for the existing recording links.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = JSON.parse(readFileSync(join(root, 'data/catalog-source.json'), 'utf8'));
const context = { window: {} };
runInNewContext(readFileSync(join(root, 'tracks.js'), 'utf8'), context);
const albums = context.window.theGiveRecordings;
if (albums.length !== source.albums.length) throw new Error('Add metadata for every album.');

const base = source.artist.url;
const artistId = `${base}#the-give`;
const ref = id => ({ '@id': id });
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const lyricSheets = {
  'Seven Years': 'seven-years.jpg',
  'Not Just Yet': 'not-just-yet.jpg',
  'Yes, But': 'yes-but.jpg',
  'Lebanon': 'lebanon.jpg',
  'Spinner Man': 'spinner-man.jpg',
  'Damn Nation': 'damnation.jpg',
  "Scarlett O'Hara": 'unmasking-my-scarlet.jpg'
};

const albumNodes = [];
const recordingNodes = [];
const recordingHtml = albums.map((album, albumIndex) => {
  const metadata = source.albums[albumIndex];
  if (metadata.title !== album.title) throw new Error(`Album metadata mismatch: ${album.title}`);
  const albumId = `${base}#album-${metadata.slug}`;
  const trackRefs = [];
  const tracksHtml = album.tracks.map((track, index) => {
    const appleId = new URL(track.appleUrl).pathname.split('/').pop();
    if (!/^\d+$/.test(appleId)) throw new Error(`Invalid Apple recording ID: ${track.title}`);
    const id = `recording-${appleId}`;
    const recordingId = `${base}#${id}`;
    trackRefs.push({ '@type': 'ListItem', position: index + 1, item: ref(recordingId) });
    recordingNodes.push({
      '@type': 'MusicRecording', '@id': recordingId, name: track.title,
      url: recordingId, byArtist: ref(artistId), inAlbum: ref(albumId),
      sameAs: [track.spotifyUrl, track.appleUrl]
    });
    const sheet = lyricSheets[track.title.replace(/ \(Live\)$/, '')];
    const sheetUrl = sheet ? `assets/lyric-sheets/${sheet}` : '';
    const title = escapeHtml(track.title);
    const albumTitle = escapeHtml(album.title);
    const links = [
      `<a href="${escapeHtml(track.spotifyUrl)}" target="_blank" rel="noreferrer" aria-label="Play ${title} from ${albumTitle} on Spotify">Spotify ↗</a>`,
      `<a href="${escapeHtml(track.appleUrl)}" target="_blank" rel="noreferrer" aria-label="Play ${title} from ${albumTitle} on Apple Music">Apple Music ↗</a>`
    ];
    if (sheet) links.push(`<a href="${sheetUrl}" target="_blank" rel="noreferrer" aria-label="View original lyric sheet for ${title}">Lyric sheet ↗</a>`);
    return `              <li id="${id}"${sheet ? ` class="has-sheet" style="--sheet-image:url('${sheetUrl}')"` : ''}><div class="track-heading"><span class="track-no" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span>${title}</span></div><div class="track-links">${links.join('')}</div></li>`;
  }).join('\n');
  albumNodes.push({
    '@type': 'MusicAlbum', '@id': albumId, name: album.title, url: albumId,
    byArtist: ref(artistId), image: new URL(metadata.image, base).href,
    sameAs: [metadata.spotifyUrl, metadata.appleUrl], numTracks: album.tracks.length,
    track: { '@type': 'ItemList', numberOfItems: album.tracks.length, itemListElement: trackRefs }
  });
  return `            <details class="record" id="album-${metadata.slug}"${albumIndex === 0 ? ' open' : ''}>
              <summary><span>${escapeHtml(album.title)}</span><span>${album.tracks.length} recordings</span></summary>
              <ol class="track-list">
${tracksHtml}
              </ol>
            </details>`;
}).join('\n');

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${base}#website`, name: 'The Give', url: base, about: ref(artistId), inLanguage: 'en' },
    { '@type': 'MusicGroup', '@id': artistId, ...source.artist, album: albumNodes.map(album => ref(album['@id'])) },
    ...albumNodes,
    ...recordingNodes
  ]
};
const json = `${JSON.stringify(graph, null, 2)}\n`;
// Escaping '<' prevents a future title from closing the inline JSON-LD script.
const inlineJson = JSON.stringify(graph).replace(/</g, '\\u003c');
const indexPath = join(root, 'index.html');
let index = readFileSync(indexPath, 'utf8');
function replaceRegion(name, body) {
  const start = `<!-- BEGIN GENERATED ${name} -->`;
  const end = `<!-- END GENERATED ${name} -->`;
  if (index.split(start).length !== 2 || index.split(end).length !== 2) {
    throw new Error(`Expected one generated ${name} region in index.html.`);
  }
  const from = index.indexOf(start) + start.length;
  const to = index.indexOf(end, from);
  if (to === -1) throw new Error(`Invalid generated ${name} markers.`);
  index = index.slice(0, from) + '\n' + body + '\n' + index.slice(to);
}
replaceRegion('CATALOG', `  <script type="application/ld+json" id="music-catalog">${inlineJson}</script>`);
replaceRegion('RECORDINGS', recordingHtml);

const outputs = new Map([[indexPath, index], [join(root, 'catalog.jsonld'), json]]);
if (process.argv.includes('--check')) {
  for (const [path, content] of outputs) {
    if (readFileSync(path, 'utf8') !== content) throw new Error(`${path} is stale; run npm run build.`);
  }
  console.log(`Catalog is current: ${albums.length} albums, ${recordingNodes.length} recordings.`);
} else {
  for (const [path, content] of outputs) writeFileSync(path, content);
  console.log(`Generated ${albums.length} albums and ${recordingNodes.length} recordings.`);
}
