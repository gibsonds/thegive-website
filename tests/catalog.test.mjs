import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const html = read('index.html');
const graph = JSON.parse(read('catalog.jsonld'));
const nodes = graph['@graph'];
const byType = type => nodes.filter(node => node['@type'] === type);
const source = JSON.parse(read('data/catalog-source.json'));
const context = { window: {} };
runInNewContext(read('tracks.js'), context);
const albums = JSON.parse(JSON.stringify(context.window.theGiveRecordings));
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

test('generated HTML and catalog are current, identical, and valid JSON', () => {
  execFileSync(process.execPath, ['scripts/build-catalog.mjs', '--check'], { cwd: root });
  const inline = html.match(/<script type="application\/ld\+json" id="music-catalog">([\s\S]*?)<\/script>/);
  assert.ok(inline);
  assert.deepEqual(JSON.parse(inline[1]), graph);
  assert.equal(graph['@context'], 'https://schema.org');
});

test('public artist identity and existing official profile URLs are preserved', () => {
  assert.equal(byType('MusicGroup').length, 1);
  const artist = byType('MusicGroup')[0];
  for (const [key, value] of Object.entries(source.artist)) assert.deepEqual(artist[key], value);
  for (const url of artist.sameAs) assert.ok(html.includes(`href="${escapeHtml(url)}"`));
  assert.equal(artist.album.length, 4);
});

test('all four albums and 63 distinct recordings retain platform links and ordering', () => {
  assert.equal(byType('MusicAlbum').length, 4);
  assert.equal(byType('MusicRecording').length, 63);
  let trackCount = 0;
  albums.forEach((album, albumIndex) => {
    const node = byType('MusicAlbum')[albumIndex];
    const metadata = source.albums[albumIndex];
    assert.equal(node.name, album.title);
    assert.equal(metadata.title, album.title);
    assert.equal(node.numTracks, album.tracks.length);
    assert.equal(node.track.numberOfItems, album.tracks.length);
    assert.deepEqual(node.sameAs, [metadata.spotifyUrl, metadata.appleUrl]);
    assert.ok(existsSync(join(root, metadata.image)));
    album.tracks.forEach((track, index) => {
      const item = node.track.itemListElement[index];
      assert.equal(item.position, index + 1);
      const recording = nodes.find(node => node['@id'] === item.item['@id']);
      assert.equal(recording.name, track.title);
      assert.equal(recording.inAlbum['@id'], node['@id']);
      assert.equal(recording.byArtist['@id'], byType('MusicGroup')[0]['@id']);
      assert.deepEqual(recording.sameAs, [track.spotifyUrl, track.appleUrl]);
      assert.match(track.spotifyUrl, /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/);
      assert.match(track.appleUrl, /^https:\/\/music\.apple\.com\/us\/song\/\d+$/);
      assert.ok(html.includes(`href="${escapeHtml(track.spotifyUrl)}"`));
      assert.ok(html.includes(`href="${escapeHtml(track.appleUrl)}"`));
      assert.ok(html.includes(`<span>${escapeHtml(track.title)}</span>`));
      trackCount++;
    });
  });
  assert.equal(trackCount, 63);
});

test('every structured entity has a stable unique ID and resolvable relationships', () => {
  const ids = new Set(nodes.map(node => node['@id']));
  assert.equal(ids.size, nodes.length);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Object.keys(value).length === 1 && value['@id']) assert.ok(ids.has(value['@id']), value['@id']);
    for (const nested of Object.values(value)) visit(nested);
  }
  visit(graph);
  for (const node of [...byType('MusicAlbum'), ...byType('MusicRecording'), ...byType('MusicGroup')]) {
    assert.ok(html.includes(`id="${new URL(node['@id']).hash.slice(1)}"`));
  }
});

test('catalog omits unverified dates, credits, events, personal details and playback claims', () => {
  const forbiddenKeys = new Set(['datePublished', 'releaseDate', 'duration', 'isrcCode', 'member', 'founder', 'email', 'telephone', 'address', 'potentialAction', 'offers']);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, nested] of Object.entries(value)) {
      assert.ok(!forbiddenKeys.has(key), `Unexpected unverified field: ${key}`);
      visit(nested);
    }
  }
  visit(graph);
  assert.equal(byType('Event').length, 0);
  for (const path of ['catalog.jsonld', 'llms.txt', 'data/catalog-source.json']) {
    assert.doesNotMatch(read(path), /collision\s*storm|david gibson|sibforms|api[_-]?key|password/i);
  }
});

test('static discovery uses canonical URLs without inventing page or event URLs', () => {
  assert.ok(html.includes('<link rel="canonical" href="https://thegivect.com/">'));
  assert.ok(html.includes('<link rel="alternate" type="application/ld+json" href="catalog.jsonld"'));
  assert.equal((read('sitemap.xml').match(/<loc>/g) || []).length, 1);
  assert.ok(read('sitemap.xml').includes('<loc>https://thegivect.com/</loc>'));
  assert.doesNotMatch(read('sitemap.xml'), /<lastmod>|#/);
  assert.match(read('robots.txt'), /User-agent: \*\nAllow: \/\n/);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/thegivect\.com\/sitemap\.xml/);
});

test('recordings and primary content do not require JavaScript', () => {
  assert.equal((html.match(/<details class="record"/g) || []).length, 4);
  assert.equal((html.match(/<li id="recording-/g) || []).length, 63);
  assert.doesNotMatch(html, /recordings\.innerHTML|<script src="tracks\.js"/);
  assert.match(html, /\.reveal\{opacity:1;transform:none\}/);
  assert.match(html, /if \('IntersectionObserver' in window\)/);
  assert.match(html, /<noscript><style>/);
});

test('existing newsletter setup and repeated menu toggles work with and without IntersectionObserver', () => {
  for (const supportsObserver of [true, false]) {
    const makeElement = () => ({
      style: {}, hidden: false, textContent: '', handlers: {},
      classes: new Set(),
      classList: {
        add(...names) { names.forEach(name => this.owner.classes.add(name)); },
        remove(...names) { names.forEach(name => this.owner.classes.delete(name)); }
      },
      addEventListener(name, callback) { this.handlers[name] = callback; }
    });
    const elements = new Map();
    for (const selector of ['#mail-cta', '#mail-note', '#mail-embed', '#mail-description', '.menu', '.nav-links', 'html', '.reveal']) {
      const element = makeElement(); element.classList.owner = element; elements.set(selector, element);
    }
    const observed = [];
    const runtime = {
      window: {}, URL, console,
      document: {
        documentElement: elements.get('html'),
        querySelector: selector => elements.get(selector),
        querySelectorAll: () => [elements.get('.reveal')]
      }
    };
    if (supportsObserver) {
      const Observer = class { observe(element) { observed.push(element); } };
      runtime.window.IntersectionObserver = Observer;
      runtime.IntersectionObserver = Observer;
    }
    runInNewContext(read('site-config.js'), runtime);
    const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
    runInNewContext(script, runtime);
    assert.equal(elements.get('#mail-cta').href, runtime.window.theGiveSiteConfig.newsletterSignupUrl);
    assert.equal(elements.get('#mail-embed').src, runtime.window.theGiveSiteConfig.newsletterEmbedUrl);
    assert.equal(elements.get('#mail-description').hidden, true);
    assert.ok(elements.get('#mail-embed').classes.has('is-ready'));
    assert.match(elements.get('#mail-note').textContent, /confirmation email/);
    assert.equal(observed.length, supportsObserver ? 1 : 0);
    assert.equal(elements.get('html').classes.has('motion-ready'), supportsObserver);
    const toggle = elements.get('.menu').handlers.click;
    for (const expected of ['flex', 'none', 'flex', 'none']) {
      toggle(); assert.equal(elements.get('.nav-links').style.display, expected);
    }
  }
});
