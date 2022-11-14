import type { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';

import Link from 'components/common/Link';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { PageContent } from 'models';

const NestedPageContainer = styled(Link)`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {

    .actions-menu {
      opacity: 0;
    }

    &:hover {

      background-color: ${({ theme }) => theme.palette.background.light};

      .actions-menu {
        opacity: 1;
      }
    }
  }
`;

export default function NestedPage ({ node }: NodeViewProps) {
  const space = useCurrentSpace();
  const { pages } = usePages();
  const nestedPage = pages[node.attrs.id];

  const isPublicShareMode = window.location.href.match(`${window.location.origin}/share/`) !== null;

  const appPath = `${isPublicShareMode ? 'share/' : ''}${space?.domain}/${nestedPage?.path}`;

  const fullPath = `${window.location.origin}/${appPath}`;

  return (
    <NestedPageContainer data-test={`nested-page-${nestedPage?.id}`} href={nestedPage ? `/${appPath}` : ''} color='inherit' data-id={`page-${nestedPage?.id}`} data-title={nestedPage?.title} data-path={fullPath}>
      <div>
        {nestedPage && <PageIcon isEditorEmpty={!nestedPage.hasContent} icon={nestedPage.icon} pageType={nestedPage.type} />}
      </div>
      <Typography fontWeight={600}>
        {nestedPage ? nestedPage.title || 'Untitled' : 'Page not found'}
      </Typography>
    </NestedPageContainer>
  );
}
