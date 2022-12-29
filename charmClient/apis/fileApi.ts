import * as http from 'adapters/http';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

export class FileApi {
  async uploadZippedMarkdown({ file, spaceId }: { file: File; spaceId: string }) {
    const buff = await file.arrayBuffer();

    const asBlob = new Blob([buff]);

    return http.POST<ForumPostPage>(`/api/pages/import/${spaceId}/zipped`, asBlob, {
      skipStringifying: true,
      headers: {
        'Content-Type': `application/octet-stream;`,
        'Content-Length': file.size
      }
    });
  }
}
