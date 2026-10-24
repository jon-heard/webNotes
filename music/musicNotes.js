const musicAssetBase = new URL('./', document.currentScript.src);
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
            <div class="music-notes-cluster"><button id="new-tune" type="button" title="Insert a new ABC tune header" aria-label="New tune">N</button></div>
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
                <button id="undo-record" type="button" title="Undo the last recorded note" aria-label="Undo the last recorded note" disabled>↶</button>
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
                <button type="button" data-record-text="\n" title="Insert newline">\\n</button>
            </div>
            <div class="music-notes-cluster music-notes-revision" aria-label="Revision 7">R.7</div>
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
            let whiteWidth = Number(readSetting('pianoWhiteKeyWidth')) || 48;
            let blackWidth = whiteWidth * 0.625;
            const minMidi = 21, maxMidi = 108;
            const whitePitches = new Set([0, 2, 4, 5, 7, 9, 11]);
            const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
            const midiSamples = new Map(), sampleFiles = new Map(), decodedSamples = new Map(), activeVoices = new Map(), keyVoiceCounts = new Map(), pointerStates = new Map();
            let audioContext = null, compressor = null, nextVoice = 1, whiteCount = 0;
            let sampleArchivePromise = null;
            let events = [], preparedText = '', totalMs = 0, metronomeBeatMs = 500, abcQpm = 120, abcUnitLength = 1 / 8, playbackState = 'stopped', playbackElapsed = 0, playbackStartedAt = 0, playbackRate = 1, playbackRun = 0, recording = false, metronomeEnabled = false, historyMutation = false;
            let playbackTimers = new Set(), metronomeTimers = new Set(), playbackVoices = new Set(), previewVoices = new Set(), previewTimers = new Set();
            const recordedEdits = [];
            const recordedAccidentals = new Map();
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
                const pitchClass = midi % 12, octave = Math.floor(midi / 12) - 1;
                const spellings = [
                    ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
                    ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]
                ];
                const [letter, accidental] = spellings[pitchClass], key = `${letter}:${octave}`;
                const previousAccidental = recordedAccidentals.has(key) ? recordedAccidentals.get(key) : null;
                let prefix = '';
                if (accidental !== 0) {
                    if (previousAccidental !== accidental) prefix = accidental > 0 ? '^' : '_';
                } else if (previousAccidental !== null && previousAccidental !== 0) prefix = '=';
                recordedAccidentals.set(key, accidental);
                let note = octave >= 5 ? letter.toLowerCase() + "'".repeat(octave - 5) : letter + ','.repeat(Math.max(0, 4 - octave));
                return { text: prefix + note, key, previousAccidental, accidental };
            }
            function insertRecordedText(token, spelling = null) {
                if (!recording) return;
                const start = editor.selectionStart, end = editor.selectionEnd;
                const delta = token.length - (end - start);
                for (const edit of recordedEdits) {
                    const editEnd = edit.start + edit.text.length;
                    if (end <= edit.start) edit.start += delta;
                    else if (start < editEnd && end > edit.start) recordedEdits.length = 0;
                }
                recordedEdits.push({ start, text: token, replaced: editor.value.slice(start, end), accidentalKey: spelling?.key, previousAccidental: spelling?.previousAccidental, accidental: spelling?.accidental });
                editor.setRangeText(token, start, end, 'end');
                host.querySelector('#undo-record').disabled = false;
                historyMutation = true;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                historyMutation = false;
            }
            function insertRecordedNote(state) {
                if (!recording || state.midi === null) return;
                const spelling = noteToken(state.midi);
                insertRecordedText(spelling.text + (state.recordLength === '1' ? '' : state.recordLength), spelling);
            }
            function undoRecordedNote() {
                const edit = recordedEdits.pop();
                if (!edit) return;
                if (editor.value.slice(edit.start, edit.start + edit.text.length) === edit.text) {
                    editor.setRangeText(edit.replaced, edit.start, edit.start + edit.text.length, 'end');
                    if (edit.accidentalKey) {
                        if (edit.previousAccidental === null) recordedAccidentals.delete(edit.accidentalKey);
                        else recordedAccidentals.set(edit.accidentalKey, edit.previousAccidental);
                    }
                    const delta = edit.replaced.length - edit.text.length;
                    for (const earlier of recordedEdits) if (edit.start + edit.text.length <= earlier.start) earlier.start += delta;
                    historyMutation = true;
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    historyMutation = false;
                }
                host.querySelector('#undo-record').disabled = recordedEdits.length === 0;
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
                const previousX = state.lastX;
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
            host.querySelector('#undo-record').addEventListener('click', undoRecordedNote);
            document.addEventListener('keydown', event => {
                if (host.hidden) return;
                if (event.ctrlKey && event.altKey && !event.metaKey && !event.shiftKey && event.key.toLowerCase() === 'r') {
                    event.preventDefault(); toggleRecording(); return;
                }
                const lengthHotkeys = { '1': '1/4', '2': '1/3', '3': '1/2', '4': '3/4', '5': '1', '6': '3/2', '7': '2', '8': '3', '9': '4' };
                if (recording && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && lengthHotkeys[event.key]) {
                    event.preventDefault(); noteLength.value = lengthHotkeys[event.key]; return;
                }
                if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z' && recordedEdits.length) {
                    event.preventDefault(); undoRecordedNote();
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
                if (!historyMutation) {
                    recordedEdits.length = 0;
                    recordedAccidentals.clear();
                    host.querySelector('#undo-record').disabled = true;
                }
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
                recordedEdits.length = 0; recordedAccidentals.clear();
                host.querySelector('#undo-record').disabled = true;
            }

            window.MusicNotepadPiano = Object.freeze({
                playNote, stopNote, stopAllNotes, playAbcEvent, stopAbcEvent, midiToNoteName: noteName,
                range: Object.freeze({ min: minMidi, max: maxMidi }), abcjs: window.ABCJS || null
            });
            buildKeyboard();
            loadSampleArchive().catch(error => console.error(error));
            return Object.freeze({
                refresh() { resetForEditorChange(); requestAnimationFrame(restorePianoRollPosition); },
                suspend: resetForEditorChange,
                loadSamples: loadSampleArchive
            });
        
}

