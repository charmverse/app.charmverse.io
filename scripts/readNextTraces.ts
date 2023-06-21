import fs from 'node:fs/promises';
import path from 'node:path';

// To generate a trace, start the dev server. Load a page completely, then make a change in a file and stop the server
const fileName = `./.next/trace`;
const pathName = path.join(process.cwd(), fileName);
function readJson(): Promise<any[]> {
  return fs.readFile(pathName).then((file) => {
    console.log(file.toString().indexOf(']\n['));
    const json = JSON.parse(`{"traces": [${file.toString().replaceAll(']\n[', '],[')}] }`);
    return json.traces.flat();
  });
}

async function init() {
  const traces = await readJson();
  console.log(
    traces
      .filter((trace) => trace.tags.name?.includes('/'))
      .sort((a, b) => (a.duration > b.duration ? -1 : 1))
      .slice(0, 100)
      .map((trace) => ({ module: trace.name, name: trace.tags.name, duration: trace.duration }))
  );
}

init();
