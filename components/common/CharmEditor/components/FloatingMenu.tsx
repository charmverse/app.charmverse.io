import { link } from '@bangle.dev/base-components';
import { PluginKey } from '@bangle.dev/core';
import { Node, ResolvedPos } from '@bangle.dev/pm';
import { FloatingMenu, floatingMenu } from '@bangle.dev/react-menu';
import { hasComponentInSchema } from '@bangle.dev/react-menu/helper';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { NodeSelection } from 'prosemirror-state';
import { LinkSubMenu } from './@bangle.dev/react-menu/LinkSubMenu';
import { Menu } from './@bangle.dev/react-menu/Menu';
import { BoldButton, CalloutButton, CodeButton, InlineCommentButton, FloatingLinkButton, HeadingButton, ItalicButton, ParagraphButton, StrikeButton, UnderlineButton } from './@bangle.dev/react-menu/MenuButtons';
import { MenuGroup } from './@bangle.dev/react-menu/MenuGroup';
import { queryIsSelectionAroundInlineComment } from './inlineComment';
import { InlineCommentSubMenu } from './inlineComment/InlineComment.components';

export type FloatingMenuVariant = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

export default function FloatingMenuComponent (
  {
    pluginKey, enableComments = true, inline = false }:
    {enableComments?: boolean, pluginKey: PluginKey, inline?: boolean
  }
) {
  const { showMessage } = useSnackbar();
  const { getPagePermissions, currentPageId } = usePages();
  const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();

  return (
    <FloatingMenu
      menuKey={pluginKey}
      renderMenuType={({ type }) => {

        if (type as FloatingMenuVariant === 'commentOnlyMenu' && permissions.comment) {
          return (
            <Menu>

              <InlineCommentButton enableComments menuKey={pluginKey} />
            </Menu>
          );
        }

        if (type === 'defaultMenu') {
          return (
            <Menu>
              <MenuGroup isLastGroup={inline}>
                <BoldButton />
                <ItalicButton />
                <CodeButton />
                <StrikeButton />
                <UnderlineButton />
                <FloatingLinkButton menuKey={pluginKey} />
                {!inline && permissions.comment && enableComments && <InlineCommentButton enableComments menuKey={pluginKey} />}
              </MenuGroup>
              {!inline && (
              <MenuGroup isLastGroup>
                <ParagraphButton />
                <CalloutButton />
                <HeadingButton level={1} />
                <HeadingButton level={2} />
                <HeadingButton level={3} />
              </MenuGroup>
              )}
            </Menu>
          );
        }
        if (type === 'linkSubMenu') {
          return (
            <Menu>
              <LinkSubMenu showMessage={showMessage} />
            </Menu>
          );
        }
        if (type === 'inlineCommentSubMenu' && !inline) {
          return (
            <Menu>
              <InlineCommentSubMenu pluginKey={pluginKey} />
            </Menu>
          );
        }
        return null;
      }}
    />
  );
}

export function floatingMenuPlugin ({ key, readOnly, enableComments = true }:{key: PluginKey, readOnly?: boolean, enableComments?: boolean}) {
  return floatingMenu.plugins({
    key,
    calculateType: (state) => {

      if (state.selection.empty
        || (state.selection as NodeSelection)?.node?.type?.name.match(
          /(image)|(cryptoPrice)|(iframe)|(page)|(mention)|(tabIndent)|(codeBlock)/
        )) {
        return null;
      }

      if (readOnly && enableComments) {
        return 'commentOnlyMenu';
      }

      if (readOnly) {
        return null;
      }

      // If we are inside an inline comment
      if (hasComponentInSchema(state, 'inline-comment')) {
        if (queryIsSelectionAroundInlineComment()(state)) {
          return 'inlineCommentSubMenu';
        }
      }

      // If we are inside a link
      if (hasComponentInSchema(state, 'link')) {
        if (
          link.queryIsSelectionAroundLink()(state)
          || link.queryIsLinkActive()(state)
        ) {
          return 'linkSubMenu';
        }
      }

      // if inside a table, first check to see if we are resizing or not
      const isInsideTable = state.selection.$anchor
        .parent.type.name.match(/^(table_cell|table_header|horizontalRule)$/);
      if (isInsideTable) {
        const { path } = (state.selection.$anchor) as ResolvedPos & { path: Node[] };
        if (path) {
          for (let index = path.length - 1; index > 0; index--) {
            const node = path[index];
            // We are inside a paragraph, then show floating menu
            if (node.type && node.type.name === 'paragraph') {
              return 'defaultMenu';
            }
          }
          // We are not inside a paragraph, so dont show floating menu
          return null;
        }
      }

      return 'defaultMenu';
    }
  });
}
