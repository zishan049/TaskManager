import { exists, mkdir, readTextFile, writeTextFile, readDir, copyFile, remove } from '@tauri-apps/plugin-fs';
import { join, appLocalDataDir, basename, extname } from '@tauri-apps/api/path';
import { v4 as uuidv4 } from 'uuid';

const DIARY_FOLDER = 'diary-data';
const ENTRIES_FOLDER = 'entries';
const MEDIA_FOLDER = 'media';

/**
 * Get the root path for diary data
 */
export async function getDiaryRoot() {
  const customPath = localStorage.getItem('taskmanager_diary_path');
  if (customPath) return customPath;

  try {
    const base = await appLocalDataDir();
    return await join(base, DIARY_FOLDER);
  } catch (e) {
    return null;
  }
}

/**
 * Set a custom root path using a directory picker
 */
export async function selectCustomStorage() {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Diary Storage Folder'
  });

  if (selected) {
    localStorage.setItem('taskmanager_diary_path', selected);
    // Re-initialize structure in new location
    await initDiaryStorage();
    return selected;
  }
  return null;
}

/**
 * Initialize directory structure
 */
export async function initDiaryStorage() {
  const root = await getDiaryRoot();
  if (!root) return null;

  try {
    const entriesPath = await join(root, ENTRIES_FOLDER);
    const mediaPath = await join(root, MEDIA_FOLDER);

    if (!(await exists(root))) await mkdir(root, { recursive: true });
    if (!(await exists(entriesPath))) await mkdir(entriesPath, { recursive: true });
    if (!(await exists(mediaPath))) await mkdir(mediaPath, { recursive: true });

    return root;
  } catch (err) {
    console.error('Failed to initialize diary storage:', err);
    return null;
  }
}

/**
 * Save a diary entry
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Object} data - { content, title, media: [] }
 */
export async function saveDiaryEntry(date, data) {
  try {
    const root = await getDiaryRoot();
    const [year, month] = date.split('-');
    const dirPath = await join(root, ENTRIES_FOLDER, year, month);
    
    if (!(await exists(dirPath))) {
      await mkdir(dirPath, { recursive: true });
    }

    const filePath = await join(dirPath, `${date}.json`);
    await writeTextFile(filePath, JSON.stringify(data, null, 2));
    console.log('Successfully saved diary entry to:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to save diary entry:', error);
    throw error;
  }
}

/**
 * Load a diary entry
 */
export async function loadDiaryEntry(date) {
  try {
    const root = await getDiaryRoot();
    const [year, month] = date.split('-');
    const filePath = await join(root, ENTRIES_FOLDER, year, month, `${date}.json`);
    
    if (await exists(filePath)) {
      const content = await readTextFile(filePath);
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.error('Failed to load diary entry:', error);
    return null;
  }
}

/**
 * List all diary entries grouped by Month/Year
 */
export async function getAllEntries() {
  const root = await getDiaryRoot();
  const entriesPath = await join(root, ENTRIES_FOLDER);
  const entries = [];

  if (!(await exists(entriesPath))) return [];

  const years = await readDir(entriesPath);
  for (const yearEntry of years) {
    if (yearEntry.isDirectory) {
      const months = await readDir(await join(entriesPath, yearEntry.name));
      for (const monthEntry of months) {
        if (monthEntry.isDirectory) {
          const files = await readDir(await join(entriesPath, yearEntry.name, monthEntry.name));
          for (const file of files) {
            if (file.name.endsWith('.json')) {
              const date = file.name.replace('.json', '');
              entries.push({
                date,
                year: yearEntry.name,
                month: monthEntry.name
              });
            }
          }
        }
      }
    }
  }

  // Sort by date descending
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Store media file locally
 */
export async function saveMedia(sourcePath) {
  try {
    const root = await getDiaryRoot();
    const mediaPath = await join(root, MEDIA_FOLDER);
    
    if (!(await exists(mediaPath))) {
      await mkdir(mediaPath, { recursive: true });
    }

    const id = uuidv4();
    const ext = await extname(sourcePath);
    const fileName = `${id}.${ext}`;
    const targetPath = await join(mediaPath, fileName);

    await copyFile(sourcePath, targetPath);
    return { fileName, fullPath: targetPath };
  } catch (error) {
    console.error('Failed to save media:', error);
    throw error;
  }
}

/**
 * Physically delete a media file
 * @param {string} fullPath - Absolute path to the file
 */
export async function deleteMedia(fullPath) {
  try {
    if (await exists(fullPath)) {
      await remove(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to delete media file:', error);
    return false;
  }
}
/**
 * Delete a diary entry
 */
export async function deleteDiaryEntry(date) {
  try {
    const root = await getDiaryRoot();
    const [year, month] = date.split('-');
    const filePath = await join(root, ENTRIES_FOLDER, year, month, `${date}.json`);
    console.log('Attempting to delete diary entry at:', filePath);
    
    if (await exists(filePath)) {
      // Read the file first to find any associated media
      try {
        const content = await readTextFile(filePath);
        const data = JSON.parse(content);
        if (data.media && Array.isArray(data.media)) {
          for (const item of data.media) {
            if (item.fullPath) {
              await deleteMedia(item.fullPath);
            }
          }
        }
      } catch (readErr) {
        console.warn('Could not read entry for media cleanup before deletion:', readErr);
      }

      await remove(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}
