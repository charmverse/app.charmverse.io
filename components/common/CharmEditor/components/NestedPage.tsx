import { NodeViewProps, RawSpecs } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Schema, Plugin, DOMOutputSpec, TextSelection, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { createTooltipDOM, SuggestTooltipRenderOpts, tooltipPlacement } from '@bangle.dev/tooltip';
import { useTheme } from '@emotion/react';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, ClickAwayListener, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import ActionsMenu from 'components/common/ActionsMenu';
import { PageIcon, PageTitle } from 'components/common/PageLayout/components/PageNavigation';
import Snackbar from 'components/common/Snackbar';
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
import { hideSuggestionsTooltip, referenceElement } from './@bangle.dev/tooltip/suggest-tooltip';

const name = 'page';
export const NestedPagePluginKey = new PluginKey('suggest_tooltip');

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

interface NestedPagePluginState {
  show: boolean;
  counter: number;
  tooltipContentDOM: HTMLElement
}

interface NestedPagePluginOptions {
  tooltipRenderOpts: SuggestTooltipRenderOpts;
}

export function nestedPagePlugins ({ tooltipRenderOpts }: NestedPagePluginOptions) {
  const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

  return [
    new Plugin<NestedPagePluginState, Schema>({
      key: NestedPagePluginKey,
      state: {
        init (_, _state) {
          return {
            show: false,
            counter: 0,
            tooltipContentDOM: tooltipDOMSpec.contentDOM
          };
        },
        apply (tr, pluginState, _oldState) {
          const meta = tr.getMeta(NestedPagePluginKey);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            // Do not change object reference if show was and is false
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              show: false,
              counter: 0
            };
          }
          if (meta.type === 'INCREMENT_COUNTER') {
            return { ...pluginState, counter: pluginState.counter + 1 };
          }
          if (meta.type === 'RESET_COUNTER') {
            return { ...pluginState, counter: 0 };
          }
          if (meta.type === 'UPDATE_COUNTER') {
            return { ...pluginState, counter: meta.value };
          }
          if (meta.type === 'DECREMENT_COUNTER') {
            return { ...pluginState, counter: pluginState.counter - 1 };
          }
          throw new Error('Unknown type');
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: NestedPagePluginKey,
      renderOpts: {
        ...tooltipRenderOpts,
        tooltipDOMSpec,
        getReferenceElement: referenceElement((state) => {
          const { selection } = state;
          return {
            end: selection.to,
            start: selection.from
          };
        })
      }
    })
  ];
}

export function NestedPagesList () {
  const { pages } = usePages();
  const { addNestedPage } = useNestedPage();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    show: isVisible
  } = usePluginState(NestedPagePluginKey) as NestedPagePluginState;

  const theme = useTheme();

  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
    },
    [view]
  );

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
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
