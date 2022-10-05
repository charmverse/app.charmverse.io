export const isDevEnv = process.env.NODE_ENV === 'development';
export const isTestEnv = process.env.APP_ENV === 'test';
export const baseUrl = process.env.DOMAIN as string;
