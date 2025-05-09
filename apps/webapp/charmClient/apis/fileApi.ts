import type { PageMeta } from '@charmverse/core/pages';
import * as http from '@packages/adapters/http';

export class FileApi {
  async uploadZippedMarkdown({ file, spaceId }: { file: File; spaceId: string }) {
    const buff = await file.arrayBuffer();

    const asBlob = new Blob([buff]);

    return http.POST<PageMeta[]>(`/api/pages/import/${spaceId}/zipped`, asBlob, {
      skipStringifying: true,
      headers: {
        'Content-Type': `application/octet-stream;`,
        'Content-Length': file.size
      }
    });
  }
}
