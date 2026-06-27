import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Project, NotificationItem, IMChannel } from '@/lib/workspace/types';
import { getRuntimeDataPath } from '@/lib/hermes/runtime/runtime-paths';

const PROJECTS_PATH = getRuntimeDataPath('hermes-projects-state.json');
const NOTIFICATIONS_PATH = getRuntimeDataPath('hermes-notifications-state.json');
const CHANNELS_PATH = getRuntimeDataPath('hermes-channels-state.json');

const ensureDirectory = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export class StatePersistence {
  static loadProjects(): Project[] {
    try {
      if (!existsSync(PROJECTS_PATH)) {
        this.saveProjects([]);
        return [];
      }
      const raw = readFileSync(PROJECTS_PATH, 'utf8');
      return JSON.parse(raw) as Project[];
    } catch (e) {
      console.error('Gagal memuat projects state, menggunakan fallback kosong:', e);
      return [];
    }
  }

  static saveProjects(projects: Project[]): void {
    try {
      ensureDirectory(PROJECTS_PATH);
      writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2), 'utf8');
    } catch (e) {
      console.error('Gagal menulis projects state ke disk:', e);
    }
  }

  static loadNotifications(): NotificationItem[] {
    try {
      if (!existsSync(NOTIFICATIONS_PATH)) {
        this.saveNotifications([]);
        return [];
      }
      const raw = readFileSync(NOTIFICATIONS_PATH, 'utf8');
      return JSON.parse(raw) as NotificationItem[];
    } catch (e) {
      console.error('Gagal memuat notifications state, menggunakan fallback kosong:', e);
      return [];
    }
  }

  static saveNotifications(notifications: NotificationItem[]): void {
    try {
      ensureDirectory(NOTIFICATIONS_PATH);
      writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2), 'utf8');
    } catch (e) {
      console.error('Gagal menulis notifications state ke disk:', e);
    }
  }

  static loadChannels(): IMChannel[] {
    try {
      if (!existsSync(CHANNELS_PATH)) {
        this.saveChannels([]);
        return [];
      }
      const raw = readFileSync(CHANNELS_PATH, 'utf8');
      return JSON.parse(raw) as IMChannel[];
    } catch (e) {
      console.error('Gagal memuat channels state, menggunakan fallback kosong:', e);
      return [];
    }
  }

  static saveChannels(channels: IMChannel[]): void {
    try {
      ensureDirectory(CHANNELS_PATH);
      writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2), 'utf8');
    } catch (e) {
      console.error('Gagal menulis channels state ke disk:', e);
    }
  }
}
