import * as http from 'adapters/http';
import type { AssetRequest, AssetResponse } from 'pages/api/mux/asset/[id]';
import type { CreateUploadRequest, CreateUploadResponse } from 'pages/api/mux/upload';
import type { UploadRequest, UploadResponse } from 'pages/api/mux/upload/[id]';

export class MuxApi {
  createUpload(params: CreateUploadRequest) {
    return http.POST<CreateUploadResponse>('/api/mux/upload', params);
  }

  getAsset(params: AssetRequest) {
    return http.GET<AssetResponse>(`/api/mux/asset/${params.id}`, { pageId: params.pageId });
  }

  getUpload(params: UploadRequest) {
    return http.GET<UploadResponse>(`/api/mux/upload/${params.id}`, { pageId: params.pageId });
  }
}
