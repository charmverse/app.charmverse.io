import fs from 'node:fs/promises';
import path from 'node:path';

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
 */
export async function writeToSameFolder({ data, fileName }: { data: any; fileName: string }) {
  await fs.writeFile(`${getCallerDirectory()}/${fileName}`, data);
}
