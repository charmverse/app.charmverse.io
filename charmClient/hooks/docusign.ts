import type { DocusignEnvelope, DocusignTemplate } from 'lib/docusign/api';
import type { PublicDocuSignProfile } from 'lib/docusign/authentication';
import type { DocusignSearchRequest } from 'pages/api/docusign/search';

import { useGET, usePOST, type MaybeString } from './helpers';

export function useGetDocusignProfile({ spaceId }: { spaceId: MaybeString }) {
  return useGET<PublicDocuSignProfile>(spaceId ? '/api/docusign/profile' : null, { spaceId });
}

export function useGetDocusignTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<{ envelopeTemplates: DocusignTemplate[] }>(spaceId ? '/api/docusign/templates' : null, { spaceId });
}

export function useGetSpaceDocusignEnvelopes({ spaceId }: { spaceId: MaybeString }) {
  return useGET<DocusignEnvelope[]>(spaceId ? '/api/docusign/envelopes' : null, { spaceId });
}

export function useGetSearchSpaceDocusignEnvelopes(query: DocusignSearchRequest | null) {
  return useGET<DocusignEnvelope[]>(query ? '/api/docusign/search' : null, query);
}

export function usePostRequestDocusignLink() {
  return usePOST<{ envelopeId: string; spaceId: string }, { url: string }>(`/api/docusign/signature-link`);
}

// More stable APIs
export function useGetDocumentsToSign({ proposalId }: { proposalId: string }) {
  return useGET<PublicDocuSignProfile>('/api/proposals/profile');
}

export function useAddDocumentToSign({ envelopeId }: { envelopeId: string; evaluationId: string }) {
  return useGET<PublicDocuSignProfile>('/api/proposals/profile');
}
