// Simple file-based cooldown (alternative to Vercel KV)
import { promises as fs } from 'fs';
import path from 'path';

const COOLDOWN_FILE = '/tmp/wind-notification-cooldown.json';
const COOLDOWN_HOURS = 4;

export async function canSendNotification(): Promise<boolean> {
  try {
    const data = await fs.readFile(COOLDOWN_FILE, 'utf8');
    const { timestamp } = JSON.parse(data);
    const now = Date.now();
    const timeDiff = now - timestamp;
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    
    return timeDiff > cooldownMs;
  } catch (error) {
    // File doesn't exist or error reading - allow notification
    return true;
  }
}

export async function setNotificationSent(): Promise<void> {
  try {
    const data = {
      timestamp: Date.now(),
      lastWindSpeed: null
    };
    await fs.writeFile(COOLDOWN_FILE, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing cooldown file:', error);
  }
}