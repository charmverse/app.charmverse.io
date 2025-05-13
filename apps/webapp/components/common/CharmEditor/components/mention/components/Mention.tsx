import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import type { MentionSpecSchemaAttrs } from '@packages/bangleeditor/components/mention/mention.specs';
import { isUUID } from '@packages/utils/strings';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import { NoAccessPageIcon, PageIcon } from 'components/common/PageIcon';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';

import { useGetPageMetaFromCache } from '../../../hooks/useGetPageMetaFromCache';
import type { NodeViewProps } from '../../@bangle.dev/core/node-view';

const MentionContainer = styled(Link)`
  border-radius: 1px;
  display: inline-block;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      box-shadow: ${({ theme }) => `0 0 0 2px ${theme.palette.background.light}`};
      background-color: ${({ theme }) => theme.palette.background.light};
    }
  }
`;

const StyledTypography = styled(Typography)`
  font-weight: 600;
  border-bottom: 0.05em solid var(--link-underline);
`;

export function Mention({ node }: NodeViewProps) {
  const { showUserProfile } = useMemberProfileDialog();
  const attrs = node.attrs as MentionSpecSchemaAttrs;
  const { getMemberById } = useMembers();
  const member = getMemberById(attrs.value);
  const { roles } = useRoles();
  const { space } = useCurrentSpace();

  const isDocumentPath = attrs.type === 'page';
  const { page, isLoading } = useGetPageMetaFromCache({
    pageId: isDocumentPath ? node.attrs.value : null
  });

  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const href =
      page?.type === 'proposal_template'
        ? `/${space?.domain}/proposals/new?template=${page.id}`
        : `/${space?.domain}/${page?.path}`;
    value = page ? (
      <MentionContainer color='inherit' href={href}>
        <Box display='flex' alignItems='center'>
          <PageIcon isLinkedPage icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          <StyledTypography>{page.title || 'Untitled'}</StyledTypography>
        </Box>
      </MentionContainer>
    ) : (
      <MentionContainer color='inherit'>
        <Box display='flex' alignItems='center'>
          <NoAccessPageIcon />
          <StyledTypography>No access</StyledTypography>
        </Box>
      </MentionContainer>
    );
  } else if (attrs.type === 'user') {
    value = (
      <MentionContainer color='secondary'>
        <Typography
          onClick={() => member?.id && showUserProfile(member.id)}
          component='span'
          color='secondary'
          sx={{ cursor: 'pointer' }}
          fontWeight={600}
        >
          <span style={{ opacity: 0.5 }}>@</span>
          {member?.username}
        </Typography>
      </MentionContainer>
    );
  } else if (attrs.type === 'role') {
    value = (
      <MentionContainer color='secondary'>
        <Typography component='span' color='secondary' sx={{ cursor: 'pointer' }} fontWeight={600}>
          <span style={{ opacity: 0.5 }}>@</span>
          {isUUID(attrs.value) ? roles?.find((role) => role.id === attrs.value)?.name : attrs.value}
        </Typography>
      </MentionContainer>
    );
  }

  return value ? <span id={`${attrs.type}-${attrs.id}`}>{value}</span> : null;
}
