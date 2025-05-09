import type { PersonaUserKycStatus } from '@charmverse/core/prisma-client';

export type PersonaInquiryAPIResponse = {
  data: {
    id: string;
    attributes: {
      status: PersonaUserKycStatus;
      'reference-id'?: string;
      'name-first'?: string;
      'name-middle'?: string;
      'name-last'?: string;
      'phone-number'?: string;
      'email-address'?: string;
      'address-street-1'?: string;
      'address-street-2'?: string;
      'address-city'?: string;
      'address-subdivision'?: string;
      'address-postal-code'?: string;
      'reviewer-comment'?: string;
      'created-at'?: string;
      'updated-at'?: string;
      'started-at'?: string;
      'completed-at'?: string;
      'failed-at'?: string;
      'marked-for-review-at'?: string;
      'decisioned-at'?: string;
      'expired-at'?: string;
      'redacted-at'?: string;
      'previous-step-name'?: string;
      'next-step-name'?: string;
      'identification-number'?: string;
      birthdate?: string;
      behaviors?: object;
      node?: string;
      tags?: string[];
      creator?: string;
      fields: object;
    };
    relashioships?: object;
    type: 'inquiry';
  };
  included: any[];
};

export type PersonaInquiry = {
  status: PersonaUserKycStatus;
  inquiryId: string;
  sessionId?: string;
  sandbox?: boolean;
};

export type PersonaEventData = {
  data: {
    id: string;
    type: string;
    attributes: {
      name: string;
      payload: PersonaInquiryAPIResponse;
      'created-at': string;
    };
  };
};
