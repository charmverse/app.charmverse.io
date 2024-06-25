export const isTestEnv = process.env.NODE_ENV === 'test';
export const isStagingEnv = process.env.REACT_APP_APP_ENV === 'staging';
export const isProdEnv = process.env.NODE_ENV === 'production' && !isTestEnv && !isStagingEnv;
export const isDevEnv =
  (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && !isProdEnv && !isStagingEnv && !isTestEnv;
export const S3_UPLOAD_REGION = process.env.S3_UPLOAD_REGION as string;
export const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET as string;
export const S3_UPLOAD_KEY = process.env.S3_UPLOAD_KEY as string;
export const S3_UPLOAD_SECRET = process.env.S3_UPLOAD_SECRET as string;
export const baseUrl = process.env.DOMAIN as string | undefined;
export const authSecret = process.env.AUTH_SECRET as string | undefined;
