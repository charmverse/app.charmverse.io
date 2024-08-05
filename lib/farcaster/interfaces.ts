export type FarcasterUser = {
  signature: string;
  publicKey: string;
  privateKey: string;
  deadline: number;
  status: 'approved' | 'pending_approval';
  signerApprovalUrl?: string;
  token: any;
  fid?: number;
};

export interface SignedKeyRequest {
  deeplinkUrl: string;
  isSponsored: boolean;
  key: string;
  requestFid: number;
  state: string;
  token: string;
  userFid: number;
  signerUser?: object;
  signerUserMetadata?: object;
}

export type LoginType = 'login' | 'connect';
