import JSZip from 'jszip';

import type { ContentToCompress } from '../file';
import { zipContent } from '../file';

describe('zipContent', () => {
  test('should handle empty input', async () => {
    const blob = await zipContent({ pages: [], csv: [] });
    const zip = new JSZip();

    // Load the generated zip blob into JSZip for verification
    await zip.loadAsync(blob);

    // Verify that no files were added to the zip
    expect(Object.keys(zip.files).length).toBe(0);
  });

  test('should add files with unique names', async () => {
    const contentToCompress: ContentToCompress = {
      pages: [
        { title: 'Page 1', contentMarkdown: 'Content 1' },
        { title: 'Page 1', contentMarkdown: 'Content 2' }
      ],
      csv: [{ title: 'Data', content: 'CSV Content' }]
    };

    const blob = await zipContent(contentToCompress);
    const zip = new JSZip();

    // Load the generated zip blob into JSZip for verification
    await zip.loadAsync(blob);

    // Verify that the correct files were added with unique names
    expect(zip.files['Page 1.md']).toBeDefined();
    expect(zip.files['Page 1 (1).md']).toBeDefined();
    expect(zip.files['Data.csv']).toBeDefined();
  });
});
