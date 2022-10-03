import type { PluginKey } from '@bangle.dev/core';
import { FloatingMenu } from '@bangle.dev/react-menu';

import { useSnackbar } from 'hooks/useSnackbar';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import type { SubMenu } from '../@bangle.dev/react-menu/floating-menu';
import { LinkSubMenu } from '../@bangle.dev/react-menu/LinkSubMenu';
import { Menu } from '../@bangle.dev/react-menu/Menu';
import { BoldButton, CalloutButton, CodeButton, FloatingLinkButton, HeadingButton, InlineCommentButton, InlineVoteButton, ItalicButton, ParagraphButton, StrikeButton, UnderlineButton } from '../@bangle.dev/react-menu/MenuButtons';
import { MenuGroup } from '../@bangle.dev/react-menu/MenuGroup';
import { InlineCommentSubMenu } from '../inlineComment/inlineComment.components';
import InlineVoteSubMenu from '../inlineVote/components/InlineVoteSubmenu';

type FloatingMenuVariant = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

interface Props {
  enableComments?: boolean;
  enableVoting?: boolean;
  pluginKey: PluginKey;
  inline?: boolean;
  pagePermissions?: IPagePermissionFlags;
}

export default function FloatingMenuComponent (
  {
    pluginKey, enableComments = true, enableVoting = false, inline = false, pagePermissions }: Props

) {
  const { showMessage } = useSnackbar();
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;

  const displayInlineVoteButton = !inline && pagePermissions?.create_poll && enableVoting;
  return (
    <FloatingMenu
      menuKey={pluginKey}
      renderMenuType={(menuType) => {
        const { type } = menuType as { type: SubMenu };
        if (type as FloatingMenuVariant === 'commentOnlyMenu' && pagePermissions?.comment) {
          return (
            <Menu>
              <InlineCommentButton enableComments menuKey={pluginKey} />
              {enableVoting && <InlineVoteButton enableVotes menuKey={pluginKey} />}
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
                {displayInlineCommentButton && <InlineCommentButton enableComments menuKey={pluginKey} />}
                {displayInlineVoteButton && <InlineVoteButton enableVotes menuKey={pluginKey} />}
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

        if (type === 'inlineVoteSubMenu' && !inline) {
          return (
            <Menu>
              <InlineVoteSubMenu pluginKey={pluginKey} />
            </Menu>
          );
        }
        return null;
      }}
    />
  );
}
