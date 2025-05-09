import { promises as fsPromises, existsSync } from 'fs';
import { join, parse, resolve } from 'path';

const { readdir, copyFile, mkdir } = fsPromises;

async function copyFilesToFlatDir(sourceDir: string, targetDir: string): Promise<void> {
  // Check if source directory exists
  if (!existsSync(sourceDir)) {
    throw new Error('Source directory does not exist');
  }

  // Create target directory if it doesn't exist
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // Recursive function to traverse directories
  async function traverseDir(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // If entry is a directory, recursively traverse it
        await traverseDir(sourcePath);
      } else {
        // If entry is a file, copy it to the target directory with a .txt extension
        const targetPath = join(targetDir, `${parse(entry.name).name}.txt`);
        await copyFile(sourcePath, targetPath);
      }
    }
  }

  // Start traversing from the source directory
  await traverseDir(sourceDir);
}

/**
 *
 * @param sourceDirs Should be a directory relative to the root of the project ie. __e2e__/proposals
 */
async function exportKnowledge(sourceDirs: string[]) {
  const target = resolve('exported-knowledge');

  for (const sourceDir of sourceDirs) {
    await copyFilesToFlatDir(sourceDir, target);
  }
}

exportKnowledge(['__e2e__/proposals', '__e2e__/po/settings', '__e2e__/utils']).then(() => console.log('done'));
