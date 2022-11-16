import type { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
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

export default function Mention ({ node }: NodeViewProps) {
  const attrs = node.attrs as MentionSpecSchemaAttrs;
  const { members } = useMembers();
  const { pages } = usePages();
  const member = members.find(_member => _member.id === attrs.value);
  const space = useCurrentSpace();
  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const page = pages[attrs.value];
    value = page && (
      <MentionContainer color='inherit' href={`/${space?.domain}/${page.path}`}>
        <Box display='flex' alignItems='center'>
          <PageIcon icon={page.icon} isEditorEmpty={!page.hasContent} pageType={page.type} />
          <Typography component='span' fontWeight={600}>{page.title || 'Untitled'}</Typography>
        </Box>
      </MentionContainer>
    );
  }
  else if (attrs.type === 'user') {
    value = (
      <MentionContainer color='secondary' href={`/u/${member?.path || member?.id}`}>
        <Typography component='span' fontWeight={600}>
          <span style={{ opacity: 0.5 }}>@</span>
          {member?.username}
        </Typography>
      </MentionContainer>
    );
  }

  return value ? (
    <span id={`${attrs.type}-${attrs.id}`}>
      {value}
    </span>
  ) : null;
}
