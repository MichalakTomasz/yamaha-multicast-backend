import { isIP } from 'node:net';
import yamahaYXC from 'yamaha-yxc-nodejs';
import { getSavedYamahaIp, saveYamahaIp } from './app-config-service';

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
    console.warn(`Yamaha client creation failed: invalid IP address \"${ip}\".`);
    return null;
  }

  const YamahaYXC = yamahaYXC.YamahaYXC;
  const client = new YamahaYXC(trimmedIp);

  try {
    await client.getStatus();

    try {
      await saveYamahaIp(trimmedIp);
    } catch (error) {
      console.warn(`Saving Yamaha IP ${trimmedIp} to app-config.json failed:`, error);
    }

    console.log(`Yamaha connection verified for ${trimmedIp}`);
    return client;
  } catch (error) {
    console.warn(`Yamaha client verification failed for ${trimmedIp}:`, error);
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

    console.warn(`Saved Yamaha IP ${savedIp} is unavailable, falling back to discovery.`);
  }

  const YamahaYXC = yamahaYXC.YamahaYXC;
  const probe = new YamahaYXC();

  try {
    const devices = await probe.discover(timeout);

    if (!Array.isArray(devices) || devices.length === 0) {
      console.warn('Yamaha discovery failed: no devices found on the local network.');
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
      console.warn('Yamaha discovery failed: discovered entries did not contain a usable IP address.');
      return {
        client: null,
        ip: null,
        source: null
      };
    }

    console.log(
      `Yamaha discovery succeeded: ${device.name ?? device.model ?? 'Unknown Yamaha device'} at ${device.ip}`
    );

    const discoveredClient = await createYamahaYXCFromIp(device.ip);

    return {
      client: discoveredClient,
      ip: discoveredClient?.ip ?? (discoveredClient ? device.ip : null),
      source: discoveredClient ? 'discovery' : null
    };
  } catch (error) {
    console.warn('Yamaha discovery failed:', error);
    return {
      client: null,
      ip: null,
      source: null
    };
  }
}