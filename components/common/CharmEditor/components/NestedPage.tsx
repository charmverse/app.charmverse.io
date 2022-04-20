import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { DOMOutputSpec, TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, ClickAwayListener, Menu, MenuItem, Typography } from '@mui/material';
import ActionsMenu from 'components/common/ActionsMenu';
import { PageIcon, PageTitle } from 'components/common/PageLayout/components/PageNavigation';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useNestedPage from 'hooks/useNestedPage';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { Page, PageContent } from 'models';
import Link from 'next/link';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isTruthy } from 'lib/utilities/types';
import { hideSuggestionsTooltip, SuggestTooltipPluginKey, SuggestTooltipPluginState } from './@bangle.dev/tooltip/suggest-tooltip';

const name = 'page';

const NestedPageContainer = styled((props: any) => <div {...props} />)`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;
  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
  }
  .actions-menu {
    opacity: 0;
  }
  &:hover .actions-menu {
    opacity: 1;
  }
`;

export function nestedPageSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: false,
      attrs: {
        // This property is used to reference the page
        id: {
          default: null
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-nested-page' }],
      toDOM: (): DOMOutputSpec => {
        return ['div', { class: 'charm-nested-page' }];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
}

export function NestedPagesList () {
  const { pages } = usePages();
  const { addNestedPage } = useNestedPage();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible,
    component
  } = usePluginState(SuggestTooltipPluginKey) as SuggestTooltipPluginState;

  const theme = useTheme();

  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
    },
    [view]
  );

  if (isVisible && component === 'nestedPage') {
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(SuggestTooltipPluginKey)(view.state, view.dispatch, view);
      }}
      >
        <Box>
          {Object.values(pages).filter(isTruthy).map(page => {
            const docContent = ((page.content) as PageContent)?.content;
            const isEditorEmpty = docContent && (docContent.length <= 1
              && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0));

            return (
              <MenuItem
                sx={{
                  background: theme.palette.background.light
                }}
                onClick={() => onSelectPage(page)}
                key={page.id}
              >
                <>
                  <div>
                    <PageIcon icon={page.icon} isEditorEmpty={Boolean(isEditorEmpty)} pageType={page.type} />
                  </div>
                  <PageTitle
                    isempty={page.title.length === 0 ? 1 : 0}
                    sx={{
                      fontWeight: 'bold',
                      height: 26,
                      lineHeight: 26
                    }}
                  >
                    {page.title.length !== 0 ? page.title : 'Untitled'}
                  </PageTitle>
                </>
              </MenuItem>
            );
          })}
        </Box>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

export function NestedPage ({ node, getPos, view }: NodeViewProps) {
  const [space] = useCurrentSpace();
  const { pages } = usePages();
  const { addNestedPage } = useNestedPage();
  const { showMessage } = useSnackbar();
  const nestedPage = pages[node.attrs.id];
  const popupState = usePopupState({ variant: 'popover', popupId: 'nested-page' });

  const docContent = ((nestedPage?.content) as PageContent)?.content;

  const isEditorEmpty = Boolean(
    docContent && (docContent.length <= 1
    && (!docContent[0] || (docContent[0] as PageContent)?.content?.length === 0))
  );

  return (
    <NestedPageContainer>
      <div>
        {nestedPage && <PageIcon isEditorEmpty={isEditorEmpty} icon={nestedPage.icon} pageType={nestedPage.type} />}
      </div>
      {nestedPage ? (
        <Link
          href={`/${(space)?.domain}/${nestedPage?.path}`}
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

      <ActionsMenu {...bindTrigger(popupState)} />

      <Menu
        {...bindMenu(popupState)}
      >
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            const pos = getPos();
            TextSelection.create(view.state.doc, pos - 1, pos + 1);
            view.dispatch(view.state.tr.setSelection(
              TextSelection.create(view.state.doc, pos - 1, pos + 1)
            ));
            view.dispatch(view.state.tr.deleteSelection());
          }}
        >
          <DeleteIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => addNestedPage()}
        >
          <ContentPasteIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Duplicate</Typography>
        </MenuItem>
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            // eslint-disable-next-line
            navigator.clipboard.writeText(`${location.origin}/${space?.domain}/${nestedPage?.path}`);
            showMessage('Link copied');
          }}
        >
          <LinkIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Copy Link</Typography>
        </MenuItem>
      </Menu>
    </NestedPageContainer>
  );
}
