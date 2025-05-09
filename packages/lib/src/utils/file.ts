import fs from 'node:fs/promises';

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

    // eslint-disable-next-line
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

export type MarkdownPageToCompress = {
  title: string;
  contentMarkdown: string;
};

export type ContentToCompress = {
  pages?: MarkdownPageToCompress[];
  csv?: { title: string; content: string }[];
};

export function zipContent({ csv = [], pages = [] }: ContentToCompress) {
  // Ensure no duplicates
  function getUniqueFilename(_filename: string, _existingFilenames: Set<string>, extension: 'md' | 'csv') {
    // Remove any forward slashes and backslashes in the filename so they don't show up as a subfolder in the end-users' device
    // eslint-disable-next-line no-useless-escape
    const sanitizedFilename = _filename.replace(/[\/\\]/g, '');

    let count = 1;
    let newFilename = sanitizedFilename;
    while (_existingFilenames.has(newFilename)) {
      newFilename = `${sanitizedFilename} (${count})`;
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
