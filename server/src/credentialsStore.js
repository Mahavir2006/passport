// credentialsStore.js
// HACKATHON SHORTCUT — in-memory Map, no encryption, no persistence.
// Credentials are lost on server restart. Never write these to the blockchain
// or return them in any client-facing API response.
// NOT safe for production use.

const store = new Map();

/**
 * Save credentials linked to a passport ID.
 * @param {string} passportId
 * @param {string} username
 * @param {string} password
 */
export function saveCredentials(passportId, username, password) {
  store.set(passportId, { username, password });
}

/**
 * Retrieve credentials for a passport ID. Returns null if not found.
 * @param {string} passportId
 * @returns {{ username: string, password: string } | null}
 */
export function getCredentials(passportId) {
  return store.get(passportId) || null;
}
