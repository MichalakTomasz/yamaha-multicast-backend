import type { YamahaConnectionSource } from '../services';

export type YamahaConnectionState = {
  client: any | null;
  ip: string | null;
  source: YamahaConnectionSource | null;
};