import type { SynapsUserKycStatus } from '@charmverse/core/prisma-client';

export type SynapsSession = {
  session_id: string;
  sandbox?: boolean;
};

export type SessionType = {
  ID_DOCUMENT: string;
  LIVENESS: string;
  PROOF_OF_ADDRESS: string;
  PHONE: string;
  EMAIL: string;
  PVID: string;
};

export type SynapsIndividualSession = {
  app: {
    name: string;
    id: string;
  };
  session: {
    id: string;
    status: SynapsUserKycStatus;
    sandbox?: boolean;
    steps: [
      {
        id: string;
        status: SynapsUserKycStatus;
        type: SessionType;
      },
      {
        id: string;
        status: SynapsUserKycStatus;
        type: SessionType;
      },
      {
        id: string;
        status: SynapsUserKycStatus;
        type: SessionType;
      }
    ];
  };
};

export type SynapsSessionDetails = Pick<SynapsIndividualSession['session'], 'id' | 'status'>;

export type SynapsEventData = {
  reason?: string;
  service: string;
  session_id: string;
  state?: SynapsUserKycStatus;
  status?: SynapsUserKycStatus;
  step_id?: string;
};
