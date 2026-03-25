import { Response } from 'express';
import { YamahaConnectionState } from '../models';

export function getSingleValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') {
        const trimmedEntry = entry.trim();
        if (trimmedEntry.length > 0) {
          return trimmedEntry;
        }
      }
    }
  }

  return undefined;
}

export function parseVolume(value: unknown): number | undefined {
  const rawValue = getSingleValue(value) ?? (typeof value === 'number' ? String(value) : undefined);
  if (rawValue === undefined) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function getZone(value: unknown): string {
  return getSingleValue(value) ?? 'main';
}

export function getYamahaOrRespond(yamahaState: YamahaConnectionState, res: Response) {
  if (!yamahaState.client) {
    res.status(503).json({ message: 'Yamaha device is unavailable.' });
    return null;
  }

  return yamahaState.client;
}

export function getConnectionStatus(yamahaState: YamahaConnectionState) {
  return {
    found: yamahaState.client !== null,
    ip: yamahaState.ip,
    source: yamahaState.source
  };
}