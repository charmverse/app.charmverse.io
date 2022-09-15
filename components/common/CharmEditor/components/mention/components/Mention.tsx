import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import Link from 'components/common/Link';
import { ReactNode } from 'react';
import { MentionSpecSchemaAttrs } from '../mention.specs';

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
  const [contributors] = useContributors();
  const { pages } = usePages();
  const contributor = contributors.find(_contributor => _contributor.id === attrs.value);
  const [space] = useCurrentSpace();
  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const page = pages[attrs.value];
    value = page && (
      <MentionContainer color='inherit' href={`/${space?.domain}/${page.path}`}>
        <Box display='flex' alignItems='center'>
          <PageIcon icon={page.icon} isEditorEmpty={checkForEmpty(page.content as PageContent)} pageType={page.type} />
          <Typography component='span' fontWeight={600}>{page.title || 'Untitled'}</Typography>
        </Box>
      </MentionContainer>
    );
  }
  else if (attrs.type === 'user') {
    value = (
      <MentionContainer color='secondary' href={`/u/${contributor?.path || contributor?.id}`}>
        <Typography component='span' fontWeight={600}>
          <span style={{ opacity: 0.5 }}>@</span>
          {contributor?.username}
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
