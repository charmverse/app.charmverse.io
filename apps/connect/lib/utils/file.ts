export const DEFAULT_MAX_FILE_SIZE_MB = 20;
export const FORM_DATA_FILE_PART_NAME = 'uploadedFile';
export const DEFAULT_ARTWORK_IMAGE_SIZE = 512;
export const FORM_DATA_IMAGE_RESIZE_TYPE = 'resizeType';
export enum ResizeType {
  Emoji = 'emoji',
  Artwork = 'artwork'
}

export const IMAGE_MAX_WIDTH: Record<ResizeType, number> = {
  emoji: 512,
  artwork: 3840 // ideal for 4k
};

export const encodeFilename = (rawName: string): string => {
  const extension = rawName.split('.').pop() || ''; // lowercase the extension to simplify possible values
  const filename = rawName.replace(extension, extension.toLowerCase());

  return encodeURIComponent(filename);
};
