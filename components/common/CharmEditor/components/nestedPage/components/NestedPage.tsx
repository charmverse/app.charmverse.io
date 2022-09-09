import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import Link from 'next/link';

const NestedPageContainer = styled((props: any) => <div {...props} />)`
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
  const [space] = useCurrentSpace();
  const { pages } = usePages();
  const nestedPage = pages[node.attrs.id];
  const isEditorEmpty = checkForEmpty(nestedPage?.content as PageContent);

  const isPublicShareMode = window.location.href.match(`${window.location.origin}/share/`) !== null;

  const appPath = isPublicShareMode ? `share/${nestedPage?.id}` : `${space?.domain}/${nestedPage?.path}`;

  const fullPath = `${window.location.origin}/${appPath}`;

  return (
    <NestedPageContainer data-id={`page-${nestedPage?.id}`} data-title={nestedPage?.title} data-path={fullPath}>
      <div>
        {nestedPage && <PageIcon isEditorEmpty={isEditorEmpty} icon={nestedPage.icon} pageType={nestedPage.type} />}
      </div>
      {nestedPage ? (
        <Link
          href={`/${appPath}`}
          passHref
        >
          <Box fontWeight={600} component='div' width='100%'>
            {nestedPage?.title || 'Untitled'}
          </Box>
        </Link>
      ) : (
        <Box fontWeight={600} component='div' width='100%'>
          Page not found
        </Box>
      )}
    </NestedPageContainer>
  );
}
