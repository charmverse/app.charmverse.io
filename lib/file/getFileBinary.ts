// example: <img src=”data:image/gif;base64, R0lGODlhCAAFAIABAMaAgP///yH5BAEAAAEALAAAAAAIAAUAAAIKBBKGebzqoJKtAAA7″ />

import { v4 } from 'uuid';

// does not work for svg sources: data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20version=%271.1%27%20width=%27379%27%20height=%27820%27/%3e
export function getFileBinary(src: string): File | null {
  if (src.startsWith('data')) {
    const contentType = src.split('image/')[1].split(';')[0];
    const fileExtension = contentType.split('+')[0]; // handle svg+xml
    const fileName = `${v4()}.${fileExtension}`;
    const rawFileContent = src.split(';base64,')[1];
    // not all data sources are base64, like svg:
    if (rawFileContent) {
      const fileContent = Buffer.from(rawFileContent, 'base64');

      // Break the buffer string into chunks of 1 kilobyte
      const chunkSize = 1024 * 1;

      const bufferLength = fileContent.length;

      const bufferChunks = [];

      for (let i = 0; i < bufferLength; i += chunkSize) {
        const chunk = fileContent.slice(i, i + chunkSize);
        bufferChunks.push(chunk);
      }

      const file: File = new File(bufferChunks, fileName, { type: `image/${contentType}` });
      return file;
    }
  }
  return null;
}
