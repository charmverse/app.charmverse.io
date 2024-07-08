import { readdir, stat, writeFile } from 'fs/promises';
import path from 'path';

import { log } from '@charmverse/core/log';

const apiDir = path.resolve(path.join(__dirname, '..', 'api'));

const outputFilePath = path.resolve(__dirname, '..', 'routes.ts');

async function traverseDirectory(dir: string): Promise<string[]> {
  const files = await readdir(dir);
  let routes: string[] = [];

  for (const file of files) {
    const absolutePath = path.join(dir, file);
    const fileStat = await stat(absolutePath);

    if (fileStat.isDirectory()) {
      routes = routes.concat(await traverseDirectory(absolutePath));
    } else if (file.endsWith('.ts') && !file.endsWith('routes.ts')) {
      const importPath = absolutePath.replace(apiDir, '').replace(/\\/g, '').replace('.ts', '');
      routes.push(importPath);
    }
  }

  return routes;
}

async function generateRoutesFile() {
  const routes = await traverseDirectory(apiDir);
  const imports = routes.map((route, index) => `import router${index} from './api${route}';`).join('\n');

  const uses = routes
    .map((_, index) => `rootRouter.use(router${index}.routes(), router${index}.allowedMethods());`)
    .join('\n');

  const content = `
/* eslint-disable import/no-extraneous-dependencies */
import Router from 'koa-router';

${imports}

const rootRouter = new Router();

${uses}

export default rootRouter;
`;

  await writeFile(outputFilePath, content);

  return routes;
}

generateRoutesFile()
  .then((routes) => log.info(`routes.ts has been generated with ${routes.length} routes`))
  .catch(log.error);
