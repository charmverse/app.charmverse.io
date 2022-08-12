export const encodeFilename = (rawName: string): string => {
  const [name, extension = ''] = rawName.split('.');

  return encodeURIComponent(`${name}.${extension.toLowerCase()}`);
};
