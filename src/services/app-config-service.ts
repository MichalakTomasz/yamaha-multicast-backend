import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../pino';

type AppConfig = {
  yamahaIp: string | null;
};

const APP_CONFIG_PATH = path.resolve(__dirname, '..', '..', 'app-config.json');

const DEFAULT_APP_CONFIG: AppConfig = {
  yamahaIp: null
};

async function ensureAppConfigFile(): Promise<void> {
  try {
    await access(APP_CONFIG_PATH);
  } catch {
    await writeFile(APP_CONFIG_PATH, `${JSON.stringify(DEFAULT_APP_CONFIG, null, 2)}\n`, 'utf8');
  }
}

export async function readAppConfig(): Promise<AppConfig> {
  await ensureAppConfigFile();

  try {
    const content = await readFile(APP_CONFIG_PATH, 'utf8');
    const parsedConfig = JSON.parse(content) as Partial<AppConfig>;

    return {
      yamahaIp: typeof parsedConfig.yamahaIp === 'string' && parsedConfig.yamahaIp.trim().length > 0
        ? parsedConfig.yamahaIp.trim()
        : null
    };
  } catch (error) {
    logger.warn({ err: error, path: APP_CONFIG_PATH }, 'Reading app-config.json failed, using default config.');
    return DEFAULT_APP_CONFIG;
  }
}

export async function getSavedYamahaIp(): Promise<string | null> {
  const config = await readAppConfig();
  return config.yamahaIp;
}

export async function saveYamahaIp(ip: string): Promise<void> {
  const trimmedIp = ip.trim();
  const nextConfig: AppConfig = {
    yamahaIp: trimmedIp.length > 0 ? trimmedIp : null
  };

  await writeFile(APP_CONFIG_PATH, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8');
}

export async function clearSavedYamahaIp(): Promise<void> {
  await writeFile(APP_CONFIG_PATH, `${JSON.stringify(DEFAULT_APP_CONFIG, null, 2)}\n`, 'utf8');
}
