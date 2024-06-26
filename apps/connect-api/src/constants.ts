export const isTestEnv = process.env.NODE_ENV === 'test';
export const isStagingEnv = process.env.REACT_APP_APP_ENV === 'staging';
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isDevEnv =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !isProdEnv && !isStagingEnv && !isTestEnv;
