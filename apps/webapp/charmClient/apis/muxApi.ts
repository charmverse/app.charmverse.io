import * as http from '@packages/adapters/http';

import type { AssetRequest, AssetResponse } from 'pages/api/mux/asset/[id]';
import type { CreateUploadResponse } from 'pages/api/mux/upload';
import type { UploadRequest, UploadResponse } from 'pages/api/mux/upload/[id]';

export class MuxApi {
  createUpload() {
    return http.POST<CreateUploadResponse>('/api/mux/upload');
  }

  getAsset(params: AssetRequest) {
    return http.GET<AssetResponse>(`/api/mux/asset/${params.id}`, { pageId: params.pageId });
  }

  getUpload(params: UploadRequest) {
    return http.GET<UploadResponse>(`/api/mux/upload/${params.id}`, { pageId: params.pageId });
  }
}
