import { getMembersExportData } from 'lib/members/getMembersExportData';
import fs from 'node:fs/promises';
import { stringify } from 'csv-stringify/sync';

export async function exportMemberDirectory() {
  const spaceId = '';
  const data = await getMembersExportData(spaceId);
  const csvContent = stringify(data, {
    cast: {
      // cast objects and arrays to proper string values
      object: (value) => {
        if (Array.isArray(value)) {
          return value.join(', ');
        }

        return JSON.stringify(value);
      }
    }
  });

  await fs.writeFile(`${__dirname}/memberDirectory.csv`, csvContent);
}

exportMemberDirectory();
