import fs from 'node:fs/promises';

import type { Page } from '@charmverse/core/dist/cjs/prisma-client';
import JSZip from 'jszip';

// https://github.com/sindresorhus/callsites/blob/main/index.js
function getCallerDirectory() {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
    };

    // eslint-disable-next-line no-unused-expressions
    new Error().stack;

    const fileName = result[1].getFileName()?.split('/') as string[];
    const callerDirectory = fileName.slice(0, fileName.length - 1).join('/');
    return callerDirectory;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

/**
 * Utility for when we need to write to the same folder as caller when executing scripts
 * @append Use this param to append content instead of overwriting the old file
 */
export async function writeToSameFolder({
  data,
  fileName,
  append
}: {
  data: string;
  fileName: string;
  append?: boolean;
}) {
  await (append ? fs.appendFile : fs.writeFile)(`${getCallerDirectory()}/${fileName}`, data);
}

export type ContentToCompress = {
  pages?: { title: string; contentMarkdown: string }[];
  csv?: { title: string; content: string }[];
};

export function zipContent({ csv = [], pages = [] }: ContentToCompress) {
  // Ensure no duplicates
  function getUniqueFilename(_filename: string, _existingFilenames: Set<string>, extension: 'md' | 'csv') {
    let count = 1;
    let newFilename = _filename;
    while (_existingFilenames.has(newFilename)) {
      newFilename = `${_filename} (${count})`;
      count += 1;
    }
    _existingFilenames.add(newFilename);
    return `${newFilename}.${extension}`;
  }

  const zip = new JSZip();
  const existingFilenames = new Set<string>();

  // Handle CSV files
  csv.forEach((file) => {
    const filename = getUniqueFilename(`${file.title}`, existingFilenames, 'csv');
    zip.file(filename, file.content ?? '');
  });

  // Handle Markdown files
  pages.forEach((page) => {
    const filename = getUniqueFilename(`${page.title}`, existingFilenames, 'md');
    zip.file(filename, page.contentMarkdown ?? ''); // Assuming page.content is already in Markdown format
  });

  // Generate ZIP file
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
