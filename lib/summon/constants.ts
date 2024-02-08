export const API_TOKEN = process.env.XPS_API_TOKEN as string | undefined;

export const DEFAULT_TENANT_ID = '355730745719783510';
export const DEFAULT_URL = '355730745719783510';

export const PRODUCTION_URLS: Record<string, string> = {
  // game7
  [DEFAULT_TENANT_ID]: DEFAULT_URL,
  // ethdenver
  '355932655192113238': 'https://ethd-api.summon.xyz',
  // zksync
  '355932655192113587': 'https://zksync-api.summon.xyz'
};

export const STAGING_URLS: Record<string, string> = {
  // game7
  '355947552633258069': 'https://staging-g7-api.summon.xyz',
  // ethdenver
  '355932655193224698': 'https://staging-ethd-api.summon.xyz',
  // zksync
  '355932655194335702': 'https://staging-zksync-api.summon.xyz'
};
