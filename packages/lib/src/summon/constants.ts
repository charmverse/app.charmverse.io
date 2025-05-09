export const API_TOKEN = process.env.XPS_API_TOKEN as string | undefined;

// These URLs could potentially be saved in the DB. But for now, we'll keep them here in case Summon changes their design
export const TENANT_URLS: Record<string, string> = {
  // game7
  '355730745719783510': 'https://g7p.io',
  // zksync
  '355932655192113587': 'https://zksync-api.summon.xyz'
};

// Just in case we need them...
const TENANT_STAGING_URLS: Record<string, string> = {
  // game7
  '355947552633258069': 'https://staging-g7-api.summon.xyz',
  // zksync
  '355932655194335702': 'https://staging-zksync-api.summon.xyz'
};
