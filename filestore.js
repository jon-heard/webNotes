/**
 * filestore.js - client helpers for filestore.php
 *
 *   setStorageDir(dir)
 *       Chooses the folder (directly inside the server's base folder) used by
 *       all later storage calls, e.g. 'demo'. '.' = the base folder
 *       itself (the default). Returns true if valid, false (unchanged) if not.
 *
 *   saveFile(filename, content, callback?)
 *       callback(success: boolean) is called once when finished.
 *
 *   listFiles(extension = '', callback?)
 *       Returns filenames in the selected folder. An optional extension
 *       (with or without a leading dot) filters the list.
 *
 *   loadFile(filename, callback, defaultContent = null)
 *       callback(content) is called once. If the file doesn't exist or can't
 *       be loaded, callback receives defaultContent.
 *
 *   deleteStoredFile(filename, callback?)
 *   renameStoredFile(oldFilename, newFilename, callback?)
 *
 * Both also return a Promise (resolving to the same value passed to the
 * callback), so you can use either style.
 *
 * Requests time out and are retried on network errors, timeouts and 5xx
 * responses. Definitive answers (400/404/413 etc.) are never retried.
 */

const FILESTORE_CONFIG = {
  url: 'filestore.php',
  timeoutMs: 4000,   // per attempt
  attempts: 3,       // total tries
  retryDelayMs: 500, // doubles after each failed attempt
  dir: '.',          // folder inside the server's base dir; '.' = base dir itself
};

/**
 * Checks a folder name the same way the server does: '.' (or empty/null) for
 * the base directory, or a single name that starts with a letter or digit and
 * contains only letters, digits, '.', '_' and '-' (max 50 chars), with no
 * slashes, backslashes or '..'.
 */
function isValidStorageDir(dir) {
  if (dir == null || dir === '' || dir === '.') return true;
  return typeof dir === 'string'
    && !dir.includes('..')
    && /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/.test(dir);
}

/**
 * Sets the folder used for all later saves/loads. Use '.' for the server's
 * base directory, or a single folder name such as 'demo' (created on first
 * save). Returns true if the name was valid and is now in use; returns false
 * (and leaves the current folder unchanged) if it was invalid.
 */
function setStorageDir(dir) {
  if (!isValidStorageDir(dir)) {
    console.warn('setStorageDir: invalid folder name', dir);
    return false;
  }
  FILESTORE_CONFIG.dir = (dir == null || dir === '') ? '.' : dir;
  return true;
}

/**
 * One POST to the server with a timeout.
 * Resolves to { ok, data, retryable }; never rejects.
 */
async function filestoreRequest(params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FILESTORE_CONFIG.timeoutMs);

  try {
    const response = await fetch(FILESTORE_CONFIG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'same-origin',
    });

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // Non-JSON reply (e.g. a PHP fatal error page) - treat as a server fault.
    }

    const ok = response.ok && data !== null && data.success === true;
    return { ok, data, retryable: !ok && (response.status >= 500 || data === null) };
  } catch (err) {
    // Network failure or timeout (AbortError)
    return { ok: false, data: null, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Runs the request, retrying transient failures. Resolves to the last result. */
async function filestoreRequestWithRetry(params) {
  let delay = FILESTORE_CONFIG.retryDelayMs;
  let result;

  for (let attempt = 1; attempt <= FILESTORE_CONFIG.attempts; attempt++) {
    result = await filestoreRequest(params);
    if (result.ok || !result.retryable || attempt === FILESTORE_CONFIG.attempts) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay *= 2;
  }
  return result;
}

function saveFile(filename, content, callback) {
  const promise = filestoreRequestWithRetry({
    action: 'save',
    dir: FILESTORE_CONFIG.dir,
    filename: String(filename),
    content: String(content),
  }).then((result) => result.ok);

  return promise.then((success) => {
    if (typeof callback === 'function') {
      try { callback(success); } catch (e) { console.error(e); }
    }
    return success;
  });
}

function listFiles(extension = '', callback) {
  const promise = filestoreRequestWithRetry({
    action: 'list',
    dir: FILESTORE_CONFIG.dir,
    extension: String(extension || '').replace(/^\./, ''),
  }).then((result) => result.ok && Array.isArray(result.data.files) ? result.data.files : []);

  return promise.then((files) => {
    if (typeof callback === 'function') {
      try { callback(files); } catch (e) { console.error(e); }
    }
    return files;
  });
}

function deleteStoredFile(filename, callback) {
  const promise = filestoreRequestWithRetry({
    action: 'delete',
    dir: FILESTORE_CONFIG.dir,
    filename: String(filename),
  }).then((result) => result.ok);

  return promise.then((success) => {
    if (typeof callback === 'function') {
      try { callback(success); } catch (e) { console.error(e); }
    }
    return success;
  });
}

function renameStoredFile(oldFilename, newFilename, callback) {
  const promise = filestoreRequestWithRetry({
    action: 'rename',
    dir: FILESTORE_CONFIG.dir,
    oldFilename: String(oldFilename),
    newFilename: String(newFilename),
  }).then((result) => result.ok);

  return promise.then((success) => {
    if (typeof callback === 'function') {
      try { callback(success); } catch (e) { console.error(e); }
    }
    return success;
  });
}

function loadFile(filename, callback, defaultContent = null) {
  const promise = filestoreRequestWithRetry({
    action: 'load',
    dir: FILESTORE_CONFIG.dir,
    filename: String(filename),
  }).then((result) =>
    result.ok && typeof result.data.content === 'string'
      ? result.data.content
      : defaultContent
  );

  return promise.then((content) => {
    if (typeof callback === 'function') {
      try { callback(content); } catch (e) { console.error(e); }
    }
    return content;
  });
}
