import type { DocusignAllowedRoleOrUser } from '@charmverse/core/prisma-client';
import type { AllowedDocusignRolesAndUsersUpdate } from '@packages/lib/docusign/allowedDocusignRolesAndUsers';
import type { DocusignEnvelope, DocusignEnvelopeLite } from '@packages/lib/docusign/api';
import type { PublicDocuSignProfile } from '@packages/lib/docusign/authentication';
import type { UserDocusignAccountsInfo } from '@packages/lib/docusign/getUserDocusignAccountsInfo';

import type { DocusignSearchRequest } from 'pages/api/docusign/search';

import { useGET, usePUT, type MaybeString } from './helpers';

export function useGetDocusignProfile({ spaceId }: { spaceId: MaybeString }) {
  return useGET<PublicDocuSignProfile | null>(spaceId ? '/api/docusign/profile' : null, { spaceId });
}

export function useGetSpaceDocusignEnvelopes({ spaceId }: { spaceId: MaybeString }) {
  return useGET<DocusignEnvelope[]>(spaceId ? '/api/docusign/envelopes' : null, { spaceId });
}

export function useGetSearchSpaceDocusignEnvelopes(query: DocusignSearchRequest | null) {
  return useGET<DocusignEnvelopeLite[]>(query ? '/api/docusign/search' : null, query);
}

export function useGetDocusignAccounts({ spaceId }: { spaceId: MaybeString }) {
  return useGET<UserDocusignAccountsInfo[]>(spaceId ? '/api/docusign/accounts' : null, { spaceId });
}

export function useGetAllowedDocusignUsersAndRoles({ spaceId }: { spaceId: MaybeString }) {
  return useGET<DocusignAllowedRoleOrUser[]>(spaceId ? '/api/docusign/allowed-docusign-roles-users' : null, {
    spaceId
  });
}

export function usePutAllowedDocusignUsersAndRoles() {
  return usePUT<AllowedDocusignRolesAndUsersUpdate>('/api/docusign/allowed-docusign-roles-users');
}

// export function useGetDocusignTemplates({ spaceId }: { spaceId: MaybeString }) {
//   return useGET<{ envelopeTemplates: DocusignTemplate[] }>(spaceId ? '/api/docusign/templates' : null, { spaceId });
// }

// export function usePostRequestDocusignLink() {
//   return usePOST<DocusignEnvelopeLinkRequest, { url: string }>(`/api/docusign/signature-link`);
// }

// More stable APIs
export function useGetDocumentsToSign({ proposalId }: { proposalId: string }) {
  return useGET<PublicDocuSignProfile>('/api/proposals/profile');
}

export function useAddDocumentToSign({ envelopeId }: { envelopeId: string; evaluationId: string }) {
  return useGET<PublicDocuSignProfile>('/api/proposals/profile');
}
