import { isIP } from 'node:net';
import yamahaYXC from 'yamaha-yxc-nodejs';
import { getSavedYamahaIp, saveYamahaIp } from './app-config-service';
import { logger } from '../pino';

type YamahaClient = any;
export type YamahaConnectionSource = 'saved' | 'discovery' | 'manual';

export type YamahaConnectionResult = {
  client: YamahaClient | null;
  ip: string | null;
  source: YamahaConnectionSource | null;
};

type YamahaDiscoveryDevice = {
  ip: string;
  model?: string;
  name?: string;
};

export function isValidYamahaIp(ip: string): boolean {
  const trimmedIp = ip.trim();
  const host = trimmedIp.split(':')[0];

  return trimmedIp.length > 0 && isIP(host) !== 0;
}

export async function createYamahaYXCFromIp(ip: string): Promise<YamahaClient | null> {
  const trimmedIp = ip.trim();

  if (!isValidYamahaIp(trimmedIp)) {
    logger.warn({ ip }, 'Yamaha client creation failed: invalid IP address.');
    return null;
  }

  const YamahaYXC = yamahaYXC.YamahaYXC;
  const client = new YamahaYXC(trimmedIp);

  try {
    await client.getStatus();

    try {
      await saveYamahaIp(trimmedIp);
    } catch (error) {
      logger.warn({ err: error, ip: trimmedIp }, 'Saving Yamaha IP to app-config.json failed.');
    }

    logger.info({ ip: trimmedIp }, 'Yamaha connection verified.');
    return client;
  } catch (error) {
    logger.warn({ err: error, ip: trimmedIp }, 'Yamaha client verification failed.');
    return null;
  }
}

export async function createYamahaYXC(timeout = 5000): Promise<YamahaConnectionResult> {
  const savedIp = await getSavedYamahaIp();

  if (savedIp) {
    const savedClient = await createYamahaYXCFromIp(savedIp);

    if (savedClient) {
      return {
        client: savedClient,
        ip: savedClient.ip ?? savedIp,
        source: 'saved'
      };
    }

    logger.warn({ ip: savedIp }, 'Saved Yamaha IP is unavailable, falling back to discovery.');
  }

  const YamahaYXC = yamahaYXC.YamahaYXC;
  const probe = new YamahaYXC();

  try {
    const devices = await probe.discover(timeout);

    if (!Array.isArray(devices) || devices.length === 0) {
      logger.warn('Yamaha discovery failed: no devices found on the local network.');
      return {
        client: null,
        ip: null,
        source: null
      };
    }

    const device = devices.find(
      (entry: YamahaDiscoveryDevice) => typeof entry?.ip === 'string' && entry.ip.trim().length > 0
    );

    if (!device) {
      logger.warn('Yamaha discovery failed: discovered entries did not contain a usable IP address.');
      return {
        client: null,
        ip: null,
        source: null
      };
    }

    logger.info(
      {
        ip: device.ip,
        deviceName: device.name ?? null,
        deviceModel: device.model ?? null
      },
      'Yamaha discovery succeeded.'
    );

    const discoveredClient = await createYamahaYXCFromIp(device.ip);

    return {
      client: discoveredClient,
      ip: discoveredClient?.ip ?? (discoveredClient ? device.ip : null),
      source: discoveredClient ? 'discovery' : null
    };
  } catch (error) {
    logger.warn({ err: error }, 'Yamaha discovery failed.');
    return {
      client: null,
      ip: null,
      source: null
    };
  }
}