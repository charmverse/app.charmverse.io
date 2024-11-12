export const encodeFilename = (rawName: string): string => {
  const extension = rawName.split('.').pop() || ''; // lowercase the extension to simplify possible values
  const filename = rawName.replace(extension, extension.toLowerCase());

  return encodeURIComponent(filename);
};

export const DEFAULT_MAX_FILE_SIZE_MB = 20;
