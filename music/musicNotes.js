const musicAssetBase = new URL('./', document.currentScript.src);
const musicKeyRoots = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
window.MusicNotes = window.MusicNotes || {};
window.MusicNotes.mount = function(editorElement, host) {
    if (!editorElement || !host) throw new Error('Music Notes requires an editor and a host element.');
    if (host.dataset.musicNotesMounted === 'true') return host.musicNotesController;
    if (!document.getElementById('music-notes-style')) {
        const style = document.createElement('style');
        style.id = 'music-notes-style';
        style.textContent = `
            :root { --white-key: 48px; --black-key: 30px; --dock-height: 188px; }
            .music-notes-dock { position: relative; z-index: 2; flex: none; background: #252629; border-top: 1px solid #444; color: #eee; font: 14px system-ui, sans-serif; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
            .music-notes-transport { min-height: 40px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px 10px; padding: 4px 8px; }
            .music-notes-cluster { display: flex; flex: none; align-items: center; gap: 5px; white-space: nowrap; }
            .music-notes-transport button { width: 32px; height: 28px; padding: 0; border: 1px solid #555; border-radius: 3px; background: #343538; color: #eee; font-size: 14px; cursor: pointer; }
            .music-notes-transport button:hover { background: #444; }
            .music-notes-transport select { height: 28px; padding: 0 3px; border: 1px solid #555; border-radius: 3px; background: #343538; color: #eee; font-size: 11px; }
            .music-notes-transport #beat-frequency { width: 50px; }
            .music-notes-slider { display: flex; flex: none; align-items: center; gap: 5px; color: #ccc; font-size: 11px; white-space: nowrap; }
            .music-notes-slider input { flex: none; width: 76px; accent-color: #e4c64c; }
            .music-notes-slider output { min-width: 28px; color: #aaa; font: 10px ui-monospace, monospace; }
            .music-notes-transport button.active { background: #8a2929; border-color: #d66; color: white; }
            .music-notes-transport #record.active { background: #e4c64c; border-color: #fff09a; color: #302700; }
            .music-notes-inserts button { background: #183c68; border-color: #376ca7; color: #fff; }
            .music-notes-inserts button:hover { background: #245184; }
            .music-notes-inserts[hidden] { display: none; }
            .music-notes-key-dialog[hidden] { display: none; }
            .music-notes-key-dialog { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 16px; background: #0009; user-select: auto; -webkit-user-select: auto; }
            .music-notes-key-card { width: min(320px, 100%); padding: 16px; border: 1px solid #555; border-radius: 6px; background: #292a2d; color: #eee; box-shadow: 0 8px 30px #0008; }
            .music-notes-key-card h2 { margin: 0 0 14px; font-size: 16px; }
            .music-notes-key-card label { display: flex; align-items: center; gap: 8px; margin: 10px 0; }
            .music-notes-key-card select { flex: 1; min-width: 0; height: 32px; background: #343538; color: #fff; border: 1px solid #555; border-radius: 3px; }
            .music-notes-key-card button { min-width: 72px; height: 32px; padding: 0 10px; border: 1px solid #555; border-radius: 3px; background: #343538; color: #eee; cursor: pointer; }
            .music-notes-key-card button:hover { background: #444; }
            .music-notes-key-card .music-notes-key-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
            .music-notes-revision { color: #aaa; font: 11px ui-monospace, monospace; padding: 0 4px; }
            .music-notes-transport .duration.flash { animation: music-notes-duration-flash .18s ease-in-out 2 alternate; }
            @keyframes music-notes-duration-flash { to { background: #f1d34a; color: #332900; border-color: #ffe985; } }
            .music-notes-roll-frame { position: relative; height: calc(var(--white-key) * 3); }
            .music-notes-roll { height: 100%; overflow: hidden; cursor: crosshair; touch-action: none; overscroll-behavior: contain; }
            .music-notes-roll.panning { cursor: grabbing; }
            .music-notes-keys { position: relative; height: 100%; }
            .music-notes-key { position: absolute; top: 0; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 7px; cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
            .music-notes-white-key { z-index: 1; width: var(--white-key); height: 100%; border: 0; border-right: 1px solid #888; border-bottom: 1px solid #888; box-shadow: inset 0 1px #888; border-radius: 0 0 3px 3px; background: linear-gradient(to bottom, #c8c8c8 0 33.333%, #eee 33.333% 100%); color: #555; }
            .music-notes-keys > .music-notes-white-key:first-child { border-left: 1px solid #888; }
            .music-notes-black-key { z-index: 2; width: var(--black-key); height: calc(var(--white-key) * 2); border: 1px solid #111; border-radius: 0 0 3px 3px; background: #17181a; color: #ddd; }
            .music-notes-key-label { pointer-events: none; font: 16px ui-monospace, monospace; }
            .music-notes-key.pressed { z-index: 3; background: #f1d34a; color: #332900; border-color: #ffe985; box-shadow: 0 0 10px #e4c64c; }
            body.keyboard-open-landscape .music-notes-roll-frame { display: none; }
        `;
        document.head.appendChild(style);
    }
    host.innerHTML = `<section class="music-notes-dock" aria-label="Piano roll">
        <div class="music-notes-transport">
            <div class="music-notes-cluster"><button id="new-tune" type="button" title="Insert a new ABC tune header" aria-label="New tune">N</button><button id="key-settings" type="button" title="Set tune key">K:</button></div>
            <div class="music-notes-cluster">
                <label class="music-notes-slider" title="Volume">Vol <input id="volume" type="range" min="0" max="3.5" value="2" step="0.05"></label>
                <label class="music-notes-slider" title="Release fade">Rel <input id="release" type="range" min="0" max="3000" value="140" step="10"><output id="release-value">140</output></label>
            </div>
            <div class="music-notes-cluster">
                <button id="record" type="button" aria-pressed="false" title="Record notes into ABC">●</button>
                <select id="note-length" aria-label="Recorded note length" title="Recorded note length">
                    <option value="1/4">1/4 (1)</option><option value="1/3">1/3 (2)</option><option value="1/2">1/2 (3)</option><option value="3/4">3/4 (4)</option><option value="1" selected>1 (5)</option>
                    <option value="3/2">3/2 (6)</option><option value="2">2 (7)</option><option value="3">3 (8)</option><option value="4">4 (9)</option>
                </select>
            </div>
            <div class="music-notes-cluster">
                <button id="play-pause" type="button" title="Play" aria-label="Play">▷</button>
                <button id="stop" type="button" title="Stop" aria-label="Stop">■</button>
                <label class="music-notes-slider" title="Playback speed">Speed <input id="speed" type="range" min="0.25" max="1.5" value="1" step="0.05"><output id="speed-value">1×</output></label>
            </div>
            <div class="music-notes-cluster">
                <button id="metronome" type="button" aria-pressed="false" title="Toggle metronome" aria-label="Toggle metronome">♥</button>
                <select id="beat-frequency" aria-label="Metronome beat interval" title="Beat interval in multiples of the ABC L: unit">
                    <option value="1/4">1/4</option><option value="1/2">1/2</option><option value="3/4">3/4</option><option value="1" selected>1</option>
                    <option value="3/2">3/2</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                </select>
            </div>
            <div id="recording-inserts" class="music-notes-cluster music-notes-inserts" hidden>
                <button type="button" data-record-text=" " title="Insert a space">_</button>
                <button type="button" data-record-text=" | " title="Insert a bar line">|</button>
                <button type="button" data-record-text=" |: " title="Insert repeat start">|:</button>
                <button type="button" data-record-text=" :| " title="Insert repeat end">:|</button>
                <button type="button" data-record-newline="true" title="Insert newline">\\n</button>
            </div>
            <div class="music-notes-cluster music-notes-revision" aria-label="Revision 10">R.10</div>
        </div>
        <div id="music-key-dialog" class="music-notes-key-dialog" hidden>
            <div class="music-notes-key-card" role="dialog" aria-modal="true" aria-labelledby="music-key-title">
                <h2 id="music-key-title">Tune key</h2>
                <label>Key <select id="music-key-select"></select></label>
                <label><input id="music-key-transpose" type="checkbox"> Transpose notes</label>
                <div class="music-notes-key-actions"><button id="music-key-cancel" type="button">Cancel</button><button id="music-key-ok" type="button">OK</button></div>
            </div>
        </div>
        <div class="music-notes-roll-frame"><div id="roll" class="music-notes-roll" aria-label="Piano keyboard" tabindex="0"><div id="keys" class="music-notes-keys"></div></div></div>
    </section>`;
    const controller = initializeMusicNotes(editorElement, host);
    host.musicNotesController = controller;
    host.dataset.musicNotesMounted = 'true';
    return controller;
};
function initializeMusicNotes(editorElement, host) {
            'use strict';

            const editor = editorElement;
            const keysElement = host.querySelector('#keys');
            const roll = host.querySelector('#roll');
            const volume = host.querySelector('#volume');
            const release = host.querySelector('#release');
            const noteLength = host.querySelector('#note-length');
            const beatFrequency = host.querySelector('#beat-frequency');
            const playPauseButton = host.querySelector('#play-pause');
            const metronomeButton = host.querySelector('#metronome');
            const keyDialog = host.querySelector('#music-key-dialog');
            const keySelect = host.querySelector('#music-key-select');
            const keyTranspose = host.querySelector('#music-key-transpose');
            const keySignatures = Object.freeze({
                C: [], G: ['^F'], D: ['^F', '^C'], A: ['^F', '^C', '^G'], E: ['^F', '^C', '^G', '^D'],
                B: ['^F', '^C', '^G', '^D', '^A'], 'F#': ['^F', '^C', '^G', '^D', '^A', '^E'],
                'C#': ['^F', '^C', '^G', '^D', '^A', '^E', '^B'],
                F: ['_B'], Bb: ['_B', '_E'], Eb: ['_B', '_E', '_A'], Ab: ['_B', '_E', '_A', '_D'],
                Db: ['_B', '_E', '_A', '_D', '_G'], Gb: ['_B', '_E', '_A', '_D', '_G', '_C'],
                Cb: ['_B', '_E', '_A', '_D', '_G', '_C', '_F'],
                'G#': ['^^F', '^C', '^G', '^D', '^A', '^E', '^B'],
                'D#': ['^^F', '^^C', '^G', '^D', '^A', '^E', '^B'],
                'A#': ['^^F', '^^C', '^^G', '^D', '^A', '^E', '^B'],
                'E#': ['^^F', '^^C', '^^G', '^^D', '^A', '^E', '^B'],
                'B#': ['^^F', '^^C', '^^G', '^^D', '^^A', '^E', '^B']
            });
            const relativeKeyLookup = Object.freeze({
                C: 'C', G: 'G', D: 'D', A: 'A', E: 'E', B: 'B', 'F#': 'F#', 'C#': 'C#',
                F: 'F', Bb: 'Bb', Eb: 'Eb', Ab: 'Ab', Db: 'Db', Gb: 'Gb', Cb: 'Cb',
                'A#': 'A#', 'D#': 'D#', 'G#': 'G#', 'E#': 'E#', 'B#': 'B#',
                Am: 'C', 'A#m': 'C#', Bm: 'D', Cm: 'Eb', 'C#m': 'E', Dm: 'F', 'D#m': 'F#',
                Em: 'G', Fm: 'Ab', 'F#m': 'A', Gm: 'Bb', 'G#m': 'B',
                Bbm: 'Db', Ebm: 'Gb', Abm: 'Cb', Dbm: 'E', Gbm: 'A', Cbm: 'Eb'
            });
            const keyOptionValues = [...musicKeyRoots, ...musicKeyRoots.map(root => `${root}m`)];
            keySelect.innerHTML = keyOptionValues.map(key => `<option value="${key}">${key}</option>`).join('');
            let currentKey = 'C';
            let whiteWidth = Number(readSetting('pianoWhiteKeyWidth')) || 48;
            let blackWidth = whiteWidth * 0.625;
            const minMidi = 21, maxMidi = 108;
            const whitePitches = new Set([0, 2, 4, 5, 7, 9, 11]);
            const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
            const midiSamples = new Map(), sampleFiles = new Map(), decodedSamples = new Map(), activeVoices = new Map(), keyVoiceCounts = new Map(), pointerStates = new Map();
            let audioContext = null, compressor = null, nextVoice = 1, whiteCount = 0;
            let sampleArchivePromise = null;
            let events = [], preparedText = '', totalMs = 0, metronomeBeatMs = 500, abcQpm = 120, abcUnitLength = 1 / 8, playbackState = 'stopped', playbackElapsed = 0, playbackStartedAt = 0, playbackRate = 1, playbackRun = 0, recording = false, metronomeEnabled = false;
            let playbackTimers = new Set(), metronomeTimers = new Set(), playbackVoices = new Set(), previewVoices = new Set(), previewTimers = new Set();
            let lastPointerNote = null;

            function readSetting(key) { try { return window.localStorage.getItem(`musicNotepad.${key}`); } catch { return null; } }
            function saveSetting(key, value) { try { window.localStorage.setItem(`musicNotepad.${key}`, String(value)); } catch {} }
            function restoreRange(key, input) {
                const raw = readSetting(key);
                if (raw === null) return;
                const saved = Number(raw);
                if (Number.isFinite(saved)) input.value = String(Math.min(Number(input.max), Math.max(Number(input.min), saved)));
            }
            restoreRange('volume', volume);
            restoreRange('release', release);
            host.querySelector('#release-value').value = release.value;
            metronomeEnabled = readSetting('metronome') === 'true';
            metronomeButton.classList.toggle('active', metronomeEnabled);
            metronomeButton.setAttribute('aria-pressed', String(metronomeEnabled));
            document.documentElement.style.setProperty('--white-key', `${whiteWidth}px`);
            document.documentElement.style.setProperty('--black-key', `${blackWidth}px`);

            function midiFromName(name) {
                const match = /^([A-G])([#b]?)(-?\d+)$/.exec(name);
                if (!match) return null;
                const semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]];
                return (Number(match[3]) + 1) * 12 + semitones + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
            }
            function noteName(midi) { return noteNames[midi % 12] + (Math.floor(midi / 12) - 1); }
            const naturalSemitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
            const letterIndexes = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
            const majorScale = [0, 2, 4, 5, 7, 9, 11], minorScale = [0, 2, 3, 5, 7, 8, 10];
            function normalizeTuneKey(key) {
                const match = /^([A-G])([#b]?)(m?)$/i.exec(String(key || ''));
                return match ? match[1].toUpperCase() + match[2] + match[3].toLowerCase() : 'C';
            }
            function keyTonic(key) {
                key = normalizeTuneKey(key);
                const minor = key.endsWith('m'), root = minor ? key.slice(0, -1) : key;
                const letter = root[0], alteration = root[1] === '#' ? 1 : root[1] === 'b' ? -1 : 0;
                return { key, root, letter, letterIndex: letterIndexes[letter], minor, midi: 60 + naturalSemitones[letter] + alteration, diatonic: 28 + letterIndexes[letter] };
            }
            function keyMajorName(key) { key = normalizeTuneKey(key); return relativeKeyLookup[key] || key; }
            function signatureEntries(key) { return keySignatures[keyMajorName(key)] || []; }
            function signatureAlteration(key, letter) {
                const item = signatureEntries(key).find(value => value.endsWith(letter));
                return item ? accidentalValue(item.slice(0, -1)) : 0;
            }
            function prefersSharps(key) {
                const first = signatureEntries(key)[0];
                return first ? first[0] === '^' : true;
            }
            function keyForDropdown(key) {
                key = normalizeTuneKey(key);
                const minor = key.endsWith('m'), root = minor ? key.slice(0, -1) : key;
                const aliases = { Bb: 'A#', Eb: 'D#', Ab: 'G#', Db: 'C#', Gb: 'F#', Cb: 'B', Fb: 'E', 'E#': 'F', 'B#': 'C' };
                const option = (aliases[root] || root) + (minor ? 'm' : '');
                return keyOptionValues.includes(option) ? option : 'C';
            }
            function headerInfo(text) {
                let offset = 0, headerEnd = 0, bodyStart = text.length, keyField = null;
                while (offset < text.length) {
                    const newline = text.indexOf('\n', offset), end = newline < 0 ? text.length : newline + 1;
                    const line = text.slice(offset, newline < 0 ? text.length : newline).replace(/\r$/, '');
                    if (/^\s*[A-Za-z]\s*:/.test(line)) {
                        headerEnd = end;
                        const match = /^([ \t]*K[ \t]*:[ \t]*)([^ \t\r\n]*)(.*)$/i.exec(line);
                        if (!keyField && match) keyField = { start: offset, end, prefix: match[1], value: match[2], suffix: match[3] };
                    } else if (!line.trim() || /^\s*%/.test(line)) {
                        // Blank lines and header comments do not end the field block.
                    } else {
                        bodyStart = offset;
                        break;
                    }
                    offset = end;
                }
                const parsed = keyField && /^([A-G][#b]?m?)/i.exec(keyField.value);
                return { headerEnd, bodyStart, keyField, key: parsed ? normalizeTuneKey(parsed[1]) : 'C' };
            }
            function setHeaderKey(text, key) {
                const info = headerInfo(text), newline = text.includes('\r\n') ? '\r\n' : '\n';
                if (info.keyField) {
                    const field = info.keyField;
                    const line = text.slice(field.start, field.end).replace(/[\r\n]+$/, '');
                    const match = /^([ \t]*K[ \t]*:[ \t]*)([^ \t]*)(.*)$/i.exec(line);
                    const replacement = `${match[1]}${key}${match[3]}`;
                    return text.slice(0, field.start) + replacement + text.slice(field.start + line.length);
                }
                const at = info.headerEnd;
                const prefix = at > 0 && text[at - 1] !== '\n' ? newline : '';
                return text.slice(0, at) + prefix + `K:${key}${newline}` + text.slice(at);
            }
            function accidentalValue(prefix) {
                if (!prefix) return null;
                if (prefix[0] === '=') return 0;
                return (prefix[0] === '^' ? 1 : -1) * prefix.length;
            }
            function accidentalPrefix(alteration) {
                if (alteration === 0) return '=';
                return alteration > 0 ? '^'.repeat(alteration) : '_'.repeat(-alteration);
            }
            function scanAbcNotes(text, start, onNote, onBar = () => {}) {
                const overrides = new Map();
                let i = Math.max(0, start);
                while (i < text.length) {
                    const lineStart = i === 0 || text[i - 1] === '\n' ? i : -1;
                    if (lineStart >= 0) {
                        const lineEnd = text.indexOf('\n', lineStart), line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
                        if (/^[ \t]*(?:w|W|V|s|r):/.test(line)) { i = lineEnd < 0 ? text.length : lineEnd + 1; continue; }
                    }
                    const ch = text[i];
                    if (ch === '%') { const end = text.indexOf('\n', i); i = end < 0 ? text.length : end + 1; continue; }
                    if (ch === '"' || ch === '!' || ch === '+') {
                        const end = text.indexOf(ch, i + 1); i = end < 0 ? text.length : end + 1; continue;
                    }
                    if (ch === '|') { overrides.clear(); onBar(); i++; continue; }
                    let noteStart = i, prefix = '';
                    if ('^_='.includes(ch)) {
                        const accidentalChar = ch;
                        while (i < text.length && text[i] === accidentalChar && prefix.length < 2) prefix += text[i++];
                    }
                    const letter = text[i];
                    if (!letter || !/[A-Ga-g]/.test(letter)) { i = Math.max(i + 1, noteStart + 1); continue; }
                    const noteIndex = i++;
                    while (i < text.length && (text[i] === "'" || text[i] === ',')) i++;
                    const token = { start: noteStart, end: i, letter: letter.toUpperCase(), lower: letter === letter.toLowerCase(), octaveMarks: text.slice(noteIndex + 1, i), prefix, explicitAlteration: accidentalValue(prefix) };
                    token.octave = (token.lower ? 5 : 4) + [...token.octaveMarks].filter(mark => mark === "'").length - [...token.octaveMarks].filter(mark => mark === ',').length;
                    onNote(token, overrides);
                }
                return overrides;
            }
            function currentTuneKey(text = editor.value) { return headerInfo(text).key; }
            function refreshTuneKey() {
                currentKey = currentTuneKey();
                keySelect.value = keyForDropdown(currentKey);
            }
            function midiFor(note) {
                if (Number.isInteger(note)) return note;
                return typeof note === 'string' ? midiFromName(note.replace('♯', '#').replace('♭', 'b')) : null;
            }
            function loadSampleArchive() {
                if (!sampleArchivePromise) {
                    sampleArchivePromise = fetch(new URL('samples_piano.zip', musicAssetBase)).then(response => {
                        if (!response.ok) throw new Error(`Could not load piano samples (${response.status}).`);
                        return response.arrayBuffer();
                    }).then(buffer => {
                        if (!window.fflate?.unzipSync) throw new Error('fflate ZIP support is unavailable.');
                        const entries = window.fflate.unzipSync(new Uint8Array(buffer));
                        for (const [path, bytes] of Object.entries(entries)) {
                            const filename = path.split('/').pop();
                            if (!filename?.toLowerCase().endsWith('.ogg')) continue;
                            const name = filename.slice(0, -4), midi = midiFromName(name);
                            if (midi !== null) { sampleFiles.set(name, bytes); midiSamples.set(midi, name); }
                        }
                        if (!sampleFiles.size) throw new Error('No piano OGG samples were found in samples_piano.zip.');
                        return sampleFiles;
                    }).catch(error => { sampleArchivePromise = null; throw error; });
                }
                return sampleArchivePromise;
            }

            function buildKeyboard(restorePosition = true) {
                const whites = document.createDocumentFragment(), blacks = document.createDocumentFragment(), positions = new Map();
                whiteCount = 0;
                for (let midi = minMidi; midi <= maxMidi; midi++) if (whitePitches.has(midi % 12)) {
                    const key = document.createElement('div');
                    key.className = 'music-notes-key music-notes-white-key'; key.dataset.midi = midi; key.setAttribute('role', 'button'); key.setAttribute('aria-label', noteName(midi));
                    key.style.left = `${whiteCount * whiteWidth}px`;
                    if (midi % 12 === 0 || midi === minMidi) {
                        const label = document.createElement('span'); label.className = 'music-notes-key-label'; label.textContent = noteName(midi); key.appendChild(label);
                    }
                    whites.appendChild(key); positions.set(midi, whiteCount++);
                }
                for (let midi = minMidi; midi <= maxMidi; midi++) if (!whitePitches.has(midi % 12)) {
                    const key = document.createElement('div');
                    key.className = 'music-notes-key music-notes-black-key'; key.dataset.midi = midi; key.setAttribute('role', 'button'); key.setAttribute('aria-label', noteName(midi));
                    key.style.left = `${positions.get(midi - 1) * whiteWidth + whiteWidth - blackWidth / 2}px`;
                    blacks.appendChild(key);
                }
                keysElement.replaceChildren(whites, blacks);
                keysElement.style.width = `${whiteCount * whiteWidth}px`;
                for (const [midi, count] of keyVoiceCounts) if (count > 0) keysElement.querySelector(`[data-midi="${midi}"]`)?.classList.add('pressed');
                if (restorePosition) requestAnimationFrame(restorePianoRollPosition);
            }
            function restorePianoRollPosition() {
                if (!roll.clientWidth) return;
                const saved = readSetting('pianoRollPosition');
                const initialized = readSetting('pianoRollPositionInitialized') === 'true';
                const c3 = keysElement.querySelector('[data-midi="48"]');
                if (initialized && saved !== null && Number.isFinite(Number(saved))) {
                    roll.scrollLeft = Math.max(0, Number(saved));
                } else if (c3) {
                    roll.scrollLeft = c3.offsetLeft;
                }
                saveSetting('pianoRollPosition', roll.scrollLeft);
                saveSetting('pianoRollPositionInitialized', 'true');
            }
            function resizeKeyboard(nextWidth, preserveX = roll.clientWidth / 2) {
                const oldWidth = whiteWidth;
                whiteWidth = Math.max(32, Math.min(96, nextWidth));
                blackWidth = whiteWidth * 0.625;
                document.documentElement.style.setProperty('--white-key', `${whiteWidth}px`);
                document.documentElement.style.setProperty('--black-key', `${blackWidth}px`);
                const anchorRatio = (roll.scrollLeft + preserveX) / oldWidth;
                buildKeyboard(false);
                requestAnimationFrame(() => {
                    roll.scrollLeft = Math.max(0, anchorRatio * whiteWidth - preserveX);
                    saveSetting('pianoRollPosition', roll.scrollLeft);
                    saveSetting('pianoWhiteKeyWidth', whiteWidth);
                });
            }
            function resetPianoRollView() {
                resizeKeyboard(48, roll.clientWidth / 2);
                requestAnimationFrame(() => {
                    const c3 = keysElement.querySelector('[data-midi="48"]');
                    if (c3) roll.scrollLeft = c3.offsetLeft;
                    saveSetting('pianoRollPosition', roll.scrollLeft);
                    saveSetting('pianoRollPositionInitialized', 'true');
                });
            }
            roll.addEventListener('scroll', () => saveSetting('pianoRollPosition', roll.scrollLeft), { passive: true });

            function setKeyGlow(midi, on) {
                const count = Math.max(0, (keyVoiceCounts.get(midi) || 0) + (on ? 1 : -1));
                if (count) keyVoiceCounts.set(midi, count); else keyVoiceCounts.delete(midi);
                keysElement.querySelector(`[data-midi="${midi}"]`)?.classList.toggle('pressed', count > 0);
            }
            function getAudioContext() {
                if (!audioContext) {
                    const Context = window.AudioContext || window.webkitAudioContext;
                    if (!Context) throw new Error('Web Audio is unavailable.');
                    audioContext = new Context();
                    compressor = audioContext.createDynamicsCompressor();
                    compressor.threshold.value = -10; compressor.knee.value = 8; compressor.ratio.value = 8;
                    compressor.attack.value = 0.003; compressor.release.value = 0.12;
                    compressor.connect(audioContext.destination);
                }
                if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
                return audioContext;
            }
            function decodeSample(name) {
                if (!decodedSamples.has(name)) {
                    const loading = loadSampleArchive().then(() => {
                        const bytes = sampleFiles.get(name);
                        if (!bytes) throw new Error(`Piano sample ${name}.ogg was not found.`);
                        const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
                        return getAudioContext().decodeAudioData(data);
                    });
                    decodedSamples.set(name, loading); loading.catch(() => decodedSamples.delete(name));
                }
                return decodedSamples.get(name);
            }
            function playNote(note, voiceId, velocity = 127) {
                const midi = midiFor(note);
                if (!Number.isInteger(midi) || midi < minMidi || midi > maxMidi) return null;
                voiceId ??= `voice-${nextVoice++}`;
                if (activeVoices.has(voiceId)) stopNote(voiceId);
                const voice = { midi, source: null, gain: null, released: false };
                activeVoices.set(voiceId, voice); setKeyGlow(midi, true);
                try {
                    getAudioContext();
                    loadSampleArchive().then(() => {
                        const sample = midiSamples.get(midi);
                        if (!sample) throw new Error(`No piano sample is mapped for MIDI note ${midi}.`);
                        return decodeSample(sample);
                    }).then(buffer => {
                        if (voice.released || activeVoices.get(voiceId) !== voice) return;
                        const source = audioContext.createBufferSource(), gain = audioContext.createGain();
                        source.buffer = buffer; gain.gain.value = Number(volume.value) * Math.max(0, Number(velocity) / 127);
                        source.connect(gain); gain.connect(compressor);
                        source.onended = () => { source.disconnect(); gain.disconnect(); voice.source = voice.gain = null; };
                        voice.source = source; voice.gain = gain; source.start();
                    }).catch(error => { console.error(error); stopNote(voiceId); });
                } catch (error) { console.error(error); stopNote(voiceId); return null; }
                return voiceId;
            }
            function stopNote(voiceId) {
                const voice = activeVoices.get(voiceId);
                if (!voice) return;
                activeVoices.delete(voiceId); voice.released = true; setKeyGlow(voice.midi, false);
                if (!voice.source || !voice.gain) return;
                const now = audioContext.currentTime, seconds = Number(release.value) / 1000;
                const gain = voice.gain, source = voice.source, current = Math.max(0.0001, gain.gain.value);
                gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(current, now);
                if (seconds > 0) { gain.gain.linearRampToValueAtTime(0, now + seconds); source.stop(now + seconds); }
                else source.stop(now);
            }
            function stopAllNotes() { for (const id of activeVoices.keys()) stopNote(id); }
            function playAbcEvent(event, eventId) {
                const pitches = event?.midiPitches || event?.pitches || [];
                const prefix = `abc-${eventId ?? nextVoice++}`;
                return pitches.map((pitch, i) => playNote(typeof pitch === 'number' ? pitch : pitch?.pitch ?? pitch?.midiPitch, `${prefix}-${i}`)).filter(id => id !== null);
            }
            function stopAbcEvent(ids) { for (const id of ids || []) stopNote(id); }

            function clearTimers(timers) { for (const id of timers) clearTimeout(id); timers.clear(); }
            function updatePlaybackControl() {
                const playing = playbackState === 'playing';
                playPauseButton.textContent = playing ? 'Ⅱ' : '▷';
                playPauseButton.title = playing ? 'Pause' : 'Play';
                playPauseButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
            }
            function stopPlaybackVoices() { for (const id of playbackVoices) stopNote(id); playbackVoices.clear(); }
            function stopPreview() { clearTimers(previewTimers); for (const id of previewVoices) stopNote(id); previewVoices.clear(); }
            function updateMetronomeBeat() {
                const [numerator, denominator = 1] = beatFrequency.value.split('/').map(Number);
                const multiplier = numerator / denominator;
                metronomeBeatMs = abcUnitLength * multiplier * 240000 / abcQpm;
            }
            function prepareTune() {
                const source = editor.value;
                if (source === preparedText && events.length) return true;
                try {
                    const tune = window.ABCJS.parseOnly(source)[0];
                    if (!tune) throw new Error('No ABC tune found.');
                    const midi = tune.setUpAudio();
                    const qpm = Number(midi.tempo) || 120, msPerWhole = 240000 / qpm, grouped = new Map();
                    const hornpipe = /^\s*R\s*:\s*hornpipe\s*$/im.test(source);
                    const lengthMatch = source.match(/^\s*L\s*:\s*(\d+)\s*\/\s*(\d+)/m);
                    abcQpm = qpm;
                    abcUnitLength = lengthMatch ? Number(lengthMatch[1]) / Number(lengthMatch[2]) : 1 / 8;
                    updateMetronomeBeat();
                    for (const track of midi.tracks || []) for (const note of track) if (note.cmd === 'note') {
                        const swingTime = value => {
                            if (!hornpipe) return value * msPerWhole;
                            const quarterBeats = value * 4;
                            const whole = Math.floor(quarterBeats + 1e-7), fraction = quarterBeats - whole;
                            const beatMs = msPerWhole / 4;
                            const swungFraction = fraction <= 0.5 ? fraction * 1.2 : 0.6 + (fraction - 0.5) * 0.8;
                            return (whole + swungFraction) * beatMs;
                        };
                        const startMs = swingTime(note.start), endMs = swingTime(note.start + note.duration);
                        const key = `${note.start}:${note.startChar}:${note.endChar}`;
                        if (!grouped.has(key)) grouped.set(key, { startMs, endMs, startChar: note.startChar, endChar: note.endChar, notes: [] });
                        const event = grouped.get(key); event.endMs = Math.max(event.endMs, endMs);
                        event.notes.push({ midi: note.pitch, velocity: note.volume || 100 });
                    }
                    events = [...grouped.values()].sort((a, b) => a.startMs - b.startMs).map((event, index) => ({ ...event, index }));
                    if (!events.length) throw new Error('No playable notes found in the ABC tune.');
                    preparedText = source; totalMs = Math.max(Number(midi.totalDuration) * msPerWhole, ...events.map(event => event.endMs));
                    playbackElapsed = 0;
                    return true;
                } catch (error) {
                    events = []; preparedText = ''; return false;
                }
            }
            function later(callback, delay, run, timers = playbackTimers) {
                const id = setTimeout(() => { timers.delete(id); if (run === playbackRun) callback(); }, Math.max(0, delay));
                timers.add(id);
            }
            function scheduleMetronome(fromMs, run, rate) {
                clearTimers(metronomeTimers);
                if (!metronomeEnabled) return;
                for (let beatMs = 0; beatMs < totalMs; beatMs += metronomeBeatMs) {
                    if (beatMs < fromMs - 1) continue;
                    later(metronomeClick, (beatMs - fromMs) / rate, run, metronomeTimers);
                }
            }
            function startFrom(milliseconds) {
                clearTimers(playbackTimers); clearTimers(metronomeTimers); stopPlaybackVoices(); stopPreview();
                playbackElapsed = Math.max(0, Math.min(totalMs, milliseconds));
                const rate = Number(host.querySelector('#speed').value);
                playbackRate = rate; playbackStartedAt = performance.now() - playbackElapsed / rate; playbackState = 'playing'; updatePlaybackControl();
                const run = ++playbackRun;
                for (const event of events) for (let pitchIndex = 0; pitchIndex < event.notes.length; pitchIndex++) {
                    const pitch = event.notes[pitchIndex], id = `play-${run}-${event.index}-${pitchIndex}`;
                    if (event.endMs <= playbackElapsed) continue;
                    later(() => { const voice = playNote(pitch.midi, id, pitch.velocity); if (voice !== null) playbackVoices.add(id); }, (event.startMs - playbackElapsed) / rate, run);
                    later(() => { stopNote(id); playbackVoices.delete(id); }, (event.endMs - playbackElapsed) / rate, run);
                }
                scheduleMetronome(playbackElapsed, run, rate);
                later(() => {
                    startFrom(0);
                }, (totalMs - playbackElapsed) / rate, run);
            }
            function play() {
                if (playbackState === 'playing') return;
                if (!prepareTune()) return;
                if (playbackState === 'stopped') {
                    const cursor = editor.selectionStart;
                    const next = events.find(event => event.endChar >= cursor) || events[0];
                    playbackElapsed = next.startMs;
                } else if (playbackElapsed >= totalMs) playbackElapsed = 0;
                startFrom(playbackElapsed);
            }
            function pause() {
                if (playbackState !== 'playing') return;
                playbackElapsed = Math.min(totalMs, (performance.now() - playbackStartedAt) * playbackRate);
                playbackState = 'paused'; updatePlaybackControl(); playbackRun++; clearTimers(playbackTimers); clearTimers(metronomeTimers); stopPlaybackVoices();
            }
            function stop() {
                playbackRun++; clearTimers(playbackTimers); clearTimers(metronomeTimers); stopPlaybackVoices(); stopPreview();
                playbackState = 'stopped'; updatePlaybackControl(); playbackElapsed = 0;
                editor.setSelectionRange(0, 0);
            }
            function metronomeClick() {
                if (!audioContext || audioContext.state !== 'running') getAudioContext();
                const now = audioContext.currentTime, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
                oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(1050, now);
                gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, Number(volume.value) * 0.45), now + 0.003);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
                oscillator.connect(gain); gain.connect(compressor);
                oscillator.start(now); oscillator.stop(now + 0.07);
                oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
            }
            function noteToken(midi) {
                const pitchClass = ((midi % 12) + 12) % 12, octave = Math.floor(midi / 12) - 1;
                const spellings = prefersSharps(currentKey)
                    ? [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]]
                    : [['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0]];
                const [letter, accidental] = spellings[pitchClass], source = editor.value, caret = editor.selectionStart;
                const info = headerInfo(source), overrideKey = `${letter}:${octave}`;
                const overrides = scanAbcNotes(source.slice(0, caret), info.bodyStart, (token, activeOverrides) => {
                    if (token.explicitAlteration !== null) activeOverrides.set(`${token.letter}:${token.octave}`, token.explicitAlteration);
                });
                const existingAlteration = overrides.has(overrideKey) ? overrides.get(overrideKey) : signatureAlteration(currentKey, letter);
                const prefix = accidental === existingAlteration ? '' : accidentalPrefix(accidental);
                let note = octave >= 5 ? letter.toLowerCase() + "'".repeat(octave - 5) : letter + ','.repeat(Math.max(0, 4 - octave));
                return { text: prefix + note };
            }
            function transposeTuneNotes(text, oldKey, newKey) {
                const start = headerInfo(text).bodyStart;
                const sourceTonic = keyTonic(oldKey), targetTonic = keyTonic(newKey);
                const sourceScale = sourceTonic.minor ? minorScale : majorScale;
                const targetScale = targetTonic.minor ? minorScale : majorScale;
                const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
                const targetOverrides = new Map(), replacements = [];
                scanAbcNotes(text, start, (token, sourceOverrides) => {
                    const sourceStateKey = `${token.letter}:${token.octave}`;
                    const sourceAlteration = token.explicitAlteration !== null
                        ? token.explicitAlteration
                        : sourceOverrides.has(sourceStateKey) ? sourceOverrides.get(sourceStateKey) : signatureAlteration(oldKey, token.letter);
                    if (token.explicitAlteration !== null) sourceOverrides.set(sourceStateKey, sourceAlteration);

                    const sourceNatural = (token.octave + 1) * 12 + naturalSemitones[token.letter];
                    const sourceMidi = sourceNatural + sourceAlteration;
                    const sourceDiatonic = token.octave * 7 + letterIndexes[token.letter];
                    const degreeOffset = sourceDiatonic - sourceTonic.diatonic;
                    const degree = ((degreeOffset % 7) + 7) % 7;
                    const octaveOffset = Math.floor(degreeOffset / 7);
                    const relationshipAlteration = sourceMidi - sourceTonic.midi - sourceScale[degree] - octaveOffset * 12;

                    const targetDiatonic = targetTonic.diatonic + degreeOffset;
                    const targetOctave = Math.floor(targetDiatonic / 7);
                    const targetLetter = letters[((targetDiatonic % 7) + 7) % 7];
                    const targetMidi = targetTonic.midi + targetScale[degree] + octaveOffset * 12 + relationshipAlteration;
                    const targetNatural = (targetOctave + 1) * 12 + naturalSemitones[targetLetter];
                    const wantedAlteration = targetMidi - targetNatural;
                    const targetStateKey = `${targetLetter}:${targetOctave}`;
                    const currentAlteration = targetOverrides.has(targetStateKey)
                        ? targetOverrides.get(targetStateKey) : signatureAlteration(newKey, targetLetter);
                    const prefix = wantedAlteration === currentAlteration ? '' : accidentalPrefix(wantedAlteration);
                    if (prefix) targetOverrides.set(targetStateKey, wantedAlteration);

                    const outputLetter = targetOctave >= 5 ? targetLetter.toLowerCase() : targetLetter;
                    const octaveMarks = targetOctave >= 5 ? "'".repeat(targetOctave - 5) : ','.repeat(Math.max(0, 4 - targetOctave));
                    replacements.push({ start: token.start, end: token.end, text: prefix + outputLetter + octaveMarks });
                }, () => targetOverrides.clear());
                for (let i = replacements.length - 1; i >= 0; i--) {
                    const item = replacements[i];
                    text = text.slice(0, item.start) + item.text + text.slice(item.end);
                }
                return text;
            }
            function applyEditorText(token, start, replaced, direction) {
                const removeLength = direction === 'undo' ? token.length : replaced.length;
                const insertText = direction === 'undo' ? replaced : token;
                editor.setRangeText(insertText, start, start + removeLength, 'end');
                editor.dispatchEvent(new Event('input', { bubbles: true }));
            }
            function insertRecordedText(token) {
                if (!recording) return;
                const start = editor.selectionStart, end = editor.selectionEnd;
                const replaced = editor.value.slice(start, end);
                const action = {
                    undo: () => applyEditorText(token, start, replaced, 'undo'),
                    redo: () => applyEditorText(token, start, replaced, 'redo')
                };
                if (typeof window.applyEditorHistoryAction === 'function') window.applyEditorHistoryAction(action);
                else action.redo();
            }
            function insertRecordedNote(state) {
                if (!recording || state.midi === null) return;
                const spelling = noteToken(state.midi);
                insertRecordedText(spelling.text + (state.recordLength === '1' ? '' : state.recordLength));
            }
            function startRecordedKey(state) {
                if (!recording || state.midi === null) return;
                state.recordLength = noteLength.value;
                state.recordOriginalLength = noteLength.value;
                state.recordOriginalIndex = [...noteLength.options].findIndex(option => option.value === noteLength.value);
                state.recordNextIndex = state.recordOriginalIndex + 1;
                state.recordTimer = setInterval(() => {
                    const index = state.recordNextIndex >= noteLength.options.length ? state.recordOriginalIndex : state.recordNextIndex;
                    state.recordNextIndex = index + 1;
                    noteLength.value = noteLength.options[index].value;
                    noteLength.classList.remove('flash'); void noteLength.offsetWidth; noteLength.classList.add('flash');
                    state.recordLength = noteLength.value;
                }, 1000);
            }
            function finishRecordedKey(state) {
                if (state.recordTimer) clearInterval(state.recordTimer);
                if (state.recordOriginalLength) noteLength.value = state.recordOriginalLength;
                noteLength.classList.remove('flash');
                insertRecordedNote(state);
                state.recordTimer = null; state.recordOriginalLength = null;
            }
            function previewEvent(index) {
                const event = events[index]; if (!event) return;
                for (let i = 0; i < event.notes.length; i++) {
                    const id = `preview-${nextVoice++}`, voice = playNote(event.notes[i].midi, id, event.notes[i].velocity);
                    if (voice !== null) {
                        previewVoices.add(id);
                        const timer = setTimeout(() => { previewTimers.delete(timer); stopNote(id); previewVoices.delete(id); }, Math.max(40, event.endMs - event.startMs));
                        previewTimers.add(timer);
                    }
                }
            }
            function keyAtPoint(x, y) {
                const node = document.elementFromPoint(x, y)?.closest('.music-notes-key');
                return node && keysElement.contains(node) ? node : null;
            }
            let pinchState = null;
            function releasePointer(pointerId, wasTap = false) {
                const state = pointerStates.get(pointerId); if (!state) return;
                const partOfPinch = pinchState?.ids.includes(pointerId);
                if (state.voiceId) stopNote(state.voiceId);
                finishRecordedKey(state);
                if (!partOfPinch && state.mode === 'pan' && Math.abs(roll.scrollLeft - state.originScroll) < whiteWidth) roll.scrollLeft = state.originScroll;
                pointerStates.delete(pointerId);
                if (pinchState?.ids.includes(pointerId)) {
                    pinchState.released.add(pointerId);
                    if (pinchState.ids.every(id => pinchState.released.has(id))) {
                        const finishedPinch = pinchState;
                        pinchState = null;
                        if (wasTap && !finishedPinch.moved && finishedPinch.ids.every(id => finishedPinch.startedPan.has(id))) resetPianoRollView();
                    }
                }
                if (!pointerStates.size) roll.classList.remove('panning');
            }
            function updateKeyboardLayout() {
                const viewport = window.visualViewport;
                const keyboardOpen = editor === document.activeElement && viewport && window.innerHeight - viewport.height > 120;
                document.body.classList.toggle('keyboard-open-landscape', Boolean(keyboardOpen && matchMedia('(orientation: landscape)').matches));
                if (keyboardOpen && matchMedia('(orientation: portrait)').matches) {
                    document.body.style.height = `${viewport.height}px`;
                } else {
                    document.body.style.removeProperty('height');
                }
            }
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', updateKeyboardLayout);
                window.visualViewport.addEventListener('scroll', updateKeyboardLayout);
                window.addEventListener('orientationchange', updateKeyboardLayout);
                editor.addEventListener('focus', updateKeyboardLayout);
                editor.addEventListener('blur', () => requestAnimationFrame(updateKeyboardLayout));
            }
            roll.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                editor.blur();
                const rect = roll.getBoundingClientRect(), y = event.clientY - rect.top;
                const key = keyAtPoint(event.clientX, event.clientY);
                const inPanZone = y <= whiteWidth;
                if (!key && !inPanZone) return;
                event.preventDefault();
                const mode = inPanZone ? 'pan' : 'note';
                const midi = mode === 'note' && key ? Number(key.dataset.midi) : null;
                const now = performance.now();
                const duplicate = midi !== null && lastPointerNote?.midi === midi && now - lastPointerNote.time < 10;
                const actualMidi = duplicate ? null : midi;
                if (midi !== null && !duplicate) lastPointerNote = { midi, time: now };
                const voiceId = actualMidi === null ? null : playNote(actualMidi, `pointer-${event.pointerId}`);
                const state = { midi: actualMidi, voiceId, mode, lastX: event.clientX, lastY: event.clientY, startX: event.clientX, startY: event.clientY, startedPan: inPanZone, pointerType: event.pointerType, duplicate, duplicateUntil: now + 10, originScroll: roll.scrollLeft, recordLength: noteLength.value };
                pointerStates.set(event.pointerId, state);
                if (actualMidi !== null) startRecordedKey(state);
                if (mode === 'pan') roll.classList.add('panning');
                roll.setPointerCapture(event.pointerId);
                const panTouches = [...pointerStates.entries()].filter(([, item]) => item.startedPan && item.pointerType !== 'mouse');
                if (panTouches.length >= 2) {
                    const [a, b] = panTouches.slice(-2);
                    pinchState = { ids: [a[0], b[0]], startedPan: new Set([a[0], b[0]]), released: new Set(), distance: Math.hypot(a[1].lastX - b[1].lastX, a[1].lastY - b[1].lastY), width: whiteWidth, moved: false };
                }
            });
            roll.addEventListener('pointermove', event => {
                const state = pointerStates.get(event.pointerId); if (!state) return;
                const previousX = state.lastX, previousY = state.lastY;
                state.lastX = event.clientX; state.lastY = event.clientY;
                if (pinchState?.ids.includes(event.pointerId)) {
                    const [first, second] = pinchState.ids.map(id => pointerStates.get(id));
                    if (first && second) {
                        const distance = Math.hypot(first.lastX - second.lastX, first.lastY - second.lastY);
                        if (Math.abs(distance - pinchState.distance) <= 5) { event.preventDefault(); return; }
                        pinchState.moved = true;
                        const ratio = Math.pow(distance / Math.max(1, pinchState.distance), 0.3);
                        resizeKeyboard(pinchState.width * ratio, (first.lastX + second.lastX) / 2 - roll.getBoundingClientRect().left);
                    }
                    event.preventDefault(); return;
                }
                const rect = roll.getBoundingClientRect(), y = event.clientY - rect.top, key = keyAtPoint(event.clientX, event.clientY);
                const isPanBand = y <= whiteWidth;
                if (state.mode === 'pan') {
                    if (event.pointerType === 'mouse' && Math.abs(event.clientY - previousY) > 2) {
                        const rect = roll.getBoundingClientRect();
                        resizeKeyboard(whiteWidth * Math.exp(-(event.clientY - previousY) * 0.0015), event.clientX - rect.left);
                    }
                    roll.scrollLeft += previousX - event.clientX; event.preventDefault(); return;
                }
                if (isPanBand) {
                    state.mode = 'pan'; state.lastX = event.clientX;
                    roll.classList.add('panning'); event.preventDefault(); return;
                }
                roll.classList.remove('panning');
                if (state.duplicate && performance.now() < state.duplicateUntil) { event.preventDefault(); return; }
                state.duplicate = false;
                if (key && Number(key.dataset.midi) !== state.midi) {
                    if (state.voiceId) stopNote(state.voiceId);
                    finishRecordedKey(state);
                    state.midi = Number(key.dataset.midi);
                    state.voiceId = playNote(state.midi, `pointer-${event.pointerId}`);
                    startRecordedKey(state);
                }
                event.preventDefault();
            });
            roll.addEventListener('pointerup', event => releasePointer(event.pointerId, true));
            roll.addEventListener('pointercancel', event => releasePointer(event.pointerId));
            roll.addEventListener('lostpointercapture', event => releasePointer(event.pointerId));
            roll.addEventListener('contextmenu', event => event.preventDefault());
            host.querySelector('#new-tune').addEventListener('click', () => {
                const starter = 'X: 1\nM: 4/4\nL: 1/8\nQ: 1/4=120\nR: reel\nK: C\n';
                if (editor.value && !window.confirm('Replace the current ABC text with a new tune header?')) return;
                editor.value = starter;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                editor.focus({ preventScroll: true }); editor.setSelectionRange(starter.length, starter.length);
            });
            function closeKeyDialog() { keyDialog.hidden = true; }
            host.querySelector('#key-settings').addEventListener('click', () => {
                refreshTuneKey();
                keySelect.value = keyForDropdown(currentKey);
                keyTranspose.checked = false;
                keyDialog.hidden = false;
            });
            host.querySelector('#music-key-cancel').addEventListener('click', closeKeyDialog);
            keyDialog.addEventListener('click', event => { if (event.target === keyDialog) closeKeyDialog(); });
            host.querySelector('#music-key-ok').addEventListener('click', () => {
                const source = editor.value, info = headerInfo(source), nextKey = keySelect.value || 'C';
                let updated = keyTranspose.checked ? transposeTuneNotes(source, info.key, nextKey) : source;
                updated = setHeaderKey(updated, nextKey);
                if (updated !== source) {
                    const caretStart = editor.selectionStart, caretEnd = editor.selectionEnd;
                    editor.value = updated;
                    editor.setSelectionRange(Math.min(caretStart, updated.length), Math.min(caretEnd, updated.length));
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                }
                closeKeyDialog();
            });
            playPauseButton.addEventListener('click', () => playbackState === 'playing' ? pause() : play());
            host.querySelector('#stop').addEventListener('click', stop);
            metronomeButton.addEventListener('click', () => {
                metronomeEnabled = !metronomeEnabled;
                saveSetting('metronome', metronomeEnabled);
                metronomeButton.classList.toggle('active', metronomeEnabled);
                metronomeButton.setAttribute('aria-pressed', String(metronomeEnabled));
                clearTimers(metronomeTimers);
                if (playbackState === 'playing' && metronomeEnabled) {
                    const position = (performance.now() - playbackStartedAt) * playbackRate;
                    scheduleMetronome(position, playbackRun, playbackRate);
                }
            });
            const recordButton = host.querySelector('#record');
            function toggleRecording() {
                recording = !recording;
                recordButton.classList.toggle('active', recording);
                recordButton.setAttribute('aria-pressed', String(recording));
                host.querySelector('#recording-inserts').hidden = !recording;
            }
            recordButton.addEventListener('click', toggleRecording);
            host.querySelectorAll('[data-record-text]').forEach(button => button.addEventListener('click', () => insertRecordedText(button.dataset.recordText)));
            host.querySelectorAll('[data-record-newline]').forEach(button => button.addEventListener('click', () => insertRecordedText('\n')));
            document.addEventListener('keydown', event => {
                if (host.hidden) return;
                if (event.key === 'Escape' && !keyDialog.hidden) { event.preventDefault(); closeKeyDialog(); return; }
                if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'z') {
                    const handled = event.shiftKey
                        ? window.redoEditorHistoryAction?.()
                        : window.undoEditorHistoryAction?.();
                    if (handled) event.preventDefault();
                    return;
                }
                if (event.ctrlKey && event.altKey && !event.metaKey && !event.shiftKey && event.key.toLowerCase() === 'r') {
                    event.preventDefault(); toggleRecording(); return;
                }
                const lengthHotkeys = { '1': '1/4', '2': '1/3', '3': '1/2', '4': '3/4', '5': '1', '6': '3/2', '7': '2', '8': '3', '9': '4' };
                if (recording && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    if (event.key === ' ' && event.shiftKey) {
                        event.preventDefault(); insertRecordedText(' | '); return;
                    }
                    if (event.key === ' ' && !event.shiftKey) {
                        event.preventDefault(); insertRecordedText(' '); return;
                    }
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault(); insertRecordedText('\n'); return;
                    }
                }
                if (recording && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && lengthHotkeys[event.key]) {
                    event.preventDefault(); noteLength.value = lengthHotkeys[event.key]; return;
                }
            });
            volume.addEventListener('input', () => saveSetting('volume', volume.value));
            release.addEventListener('input', () => {
                host.querySelector('#release-value').value = release.value;
                saveSetting('release', release.value);
            });
            const speed = host.querySelector('#speed');
            speed.addEventListener('input', () => {
                host.querySelector('#speed-value').value = `${Number(speed.value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}×`;
                if (playbackState === 'playing') {
                    const position = (performance.now() - playbackStartedAt) * playbackRate;
                    startFrom(position);
                }
            });
            beatFrequency.addEventListener('input', () => {
                updateMetronomeBeat();
                if (playbackState === 'playing' && metronomeEnabled) {
                    const position = (performance.now() - playbackStartedAt) * playbackRate;
                    scheduleMetronome(position, playbackRun, playbackRate);
                }
            });
            editor.addEventListener('input', () => {
                refreshTuneKey();
                playbackRun++; clearTimers(playbackTimers); clearTimers(metronomeTimers); stopPlaybackVoices(); stopPreview();
                playbackState = 'stopped'; updatePlaybackControl(); playbackElapsed = 0;
                preparedText = ''; events = [];
            });

            function resetForEditorChange() {
                playbackRun++; clearTimers(playbackTimers); clearTimers(metronomeTimers); stopPlaybackVoices(); stopPreview();
                for (const state of pointerStates.values()) if (state.recordTimer) clearInterval(state.recordTimer);
                pointerStates.clear(); stopAllNotes(); roll.classList.remove('panning');
                playbackState = 'stopped'; updatePlaybackControl(); playbackElapsed = 0;
                preparedText = ''; events = [];
                refreshTuneKey();
            }

            window.MusicNotepadPiano = Object.freeze({
                playNote, stopNote, stopAllNotes, playAbcEvent, stopAbcEvent, midiToNoteName: noteName,
                range: Object.freeze({ min: minMidi, max: maxMidi }), abcjs: window.ABCJS || null
            });
            refreshTuneKey();
            buildKeyboard();
            loadSampleArchive().catch(error => console.error(error));
            return Object.freeze({
                refresh() { resetForEditorChange(); refreshTuneKey(); requestAnimationFrame(restorePianoRollPosition); },
                suspend: resetForEditorChange,
                loadSamples: loadSampleArchive
            });
        
}

