import fs from 'node:fs/promises';
import path from 'node:path';

import { InvalidInputError } from '@packages/core/errors';

import type { SpaceDataExport } from './exportSpaceData';
import type { ImportParams } from './interfaces';

export async function getImportData({
  exportData,
  exportName
}: Pick<ImportParams, 'exportData' | 'exportName'>): Promise<Partial<SpaceDataExport>> {
  if (!exportData && !exportName) {
    throw new InvalidInputError(`Export data or name of file in lib/templates/exports/ folder is required`);
  }
  if (exportData) {
    return exportData;
  }

  const resolvedPath = path.resolve(
    path.join(
      `${process.env.NODE_ENV === 'production' ? 'apps/webapp/' : ''}lib`,
      'templates',
      'exports',
      exportName?.endsWith('.json') ? exportName : `${exportName}.json`
    )
  );

  const parsedData = JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));

  if (!parsedData) {
    throw new InvalidInputError('No data found');
  }

  return parsedData as SpaceDataExport;
}
