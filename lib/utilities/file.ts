import fs from 'node:fs/promises';

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
