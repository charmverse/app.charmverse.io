import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import { Box, Typography } from '@mui/material';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import Link from 'next/link';
import { ReactNode } from 'react';
import { MentionSpecSchemaAttrs } from '../mention.specs';

export default function Mention ({ node }: NodeViewProps) {
  const attrs = node.attrs as MentionSpecSchemaAttrs;
  const theme = useTheme();
  const [contributors] = useContributors();
  const { pages } = usePages();
  const contributor = contributors.find(_contributor => _contributor.id === attrs.value);
  const [space] = useCurrentSpace();
  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const page = pages[attrs.value];
    value = page && (
    <Link
      href={`/${space?.domain}/${page.path}`}
      passHref
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        top: 5,
        cursor: 'pointer'
      }}
      >
        <PageIcon icon={page.icon} isEditorEmpty={checkForEmpty(page.content as PageContent)} pageType={page.type} />
        <div>{page.title || 'Untitled'}</div>
      </Box>
    </Link>
    );
  }
  else if (attrs.type === 'user') {
    value = (
      <Typography fontSize='inherit' fontWeight='inherit'>
        <span style={{ opacity: 0.6 }}>@</span>
        <span style={{ opacity: 0.75 }}>{contributor?.username}</span>
      </Typography>
    );
  }

  return value ? (
    <Box
      component='span'
      sx={{
        borderRadius: theme.spacing(0.5),
        fontWeight: 600,
        opacity: 0.75,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75
      }}
      id={`${attrs.type}-${attrs.id}`}
    >
      {value}
    </Box>
  ) : null;
}
