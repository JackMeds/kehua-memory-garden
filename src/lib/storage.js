/* ═══════════════════════════════════════════════════════════
   storage.js — IndexedDB persistence layer
   ═══════════════════════════════════════════════════════════ */

import { openDB } from 'idb';

const DB_NAME = 'kehua-viewer';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save parsed user data (posts JSON) to IndexedDB.
 * Media blobs are NOT stored — only lightweight text data.
 */
export async function saveUserData(username, posts) {
  try {
    const db = await getDB();
    // Strip blob URLs before saving — they're ephemeral
    const cleanPosts = posts.map(p => ({
      ...p,
      images: p.images.map(img => ({ filename: img.filename, relativePath: img.relativePath })),
      videos: p.videos.map(vid => ({ filename: vid.filename, relativePath: vid.relativePath })),
    }));
    await db.put('data', { username, posts: cleanPosts, savedAt: Date.now() }, 'userData');
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Load cached user data from IndexedDB.
 * Returns { username, posts, savedAt } or null.
 */
export async function loadUserData() {
  try {
    const db = await getDB();
    return await db.get('data', 'userData');
  } catch {
    return null;
  }
}

/**
 * Clear all cached data.
 */
export async function clearUserData() {
  try {
    const db = await getDB();
    await db.delete('data', 'userData');
    await db.delete('data', 'dirHandle');
  } catch (err) {
    console.warn('Failed to clear IndexedDB:', err);
  }
}

/**
 * Persist a FileSystemDirectoryHandle for re-access on next visit.
 * Only works with File System Access API (Chrome/Edge).
 */
export async function saveDirHandle(handle) {
  try {
    const db = await getDB();
    await db.put('data', handle, 'dirHandle');
  } catch (err) {
    console.warn('Failed to save directory handle:', err);
  }
}

/**
 * Load a persisted FileSystemDirectoryHandle.
 */
export async function loadDirHandle() {
  try {
    const db = await getDB();
    return await db.get('data', 'dirHandle');
  } catch {
    return null;
  }
}
