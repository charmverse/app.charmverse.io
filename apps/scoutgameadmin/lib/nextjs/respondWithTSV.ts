import { stringify } from 'csv-stringify/sync';

export async function respondWithTSV(rows: any[], filename: string) {
  const exportString = stringify(rows, { header: true, columns: rows[0] ? Object.keys(rows[0]) : ['No Results'] });

  return new Response(exportString, {
    status: 200,
    headers: {
      'Content-Type': 'text/tsv',
      'Content-Disposition': `attachment; filename=${filename}`
    }
  });
}
