import type { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';

import type { MentionSpecSchemaAttrs } from '../mention.specs';

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

export default function Mention({ node }: NodeViewProps) {
  const { showMemberProfile } = useMemberProfile();
  const attrs = node.attrs as MentionSpecSchemaAttrs;
  const { members } = useMembers();
  const { pages } = usePages();
  const member = members.find((_member) => _member.id === attrs.value);
  const space = useCurrentSpace();
  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const page = pages[attrs.value];
    value = page && (
      <MentionContainer color='inherit' href={`/${space?.domain}/${page.path}`}>
        <Box display='flex' alignItems='center'>
          <PageIcon isLinkedPage icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          <StyledTypography>{page.title || 'Untitled'}</StyledTypography>
        </Box>
      </MentionContainer>
    );
  } else if (attrs.type === 'user') {
    value = (
      <MentionContainer color='secondary'>
        <Typography
          onClick={() => member?.id && showMemberProfile(member.id)}
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
  }

  return value ? <span id={`${attrs.type}-${attrs.id}`}>{value}</span> : null;
}
