import env from '@beam-australia/react-env';

export const decentApiKey =
  env('DECENT_API_KEY') || (process.env.REACT_APP_DECENT_API_KEY as string) || '4f081ef9fb975f01984f605620489dfb';
