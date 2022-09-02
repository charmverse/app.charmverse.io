import { PluginKey } from '@bangle.dev/core';
import { FloatingMenu } from '@bangle.dev/react-menu';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { PageType } from '@prisma/client';
import { SubMenu } from '../@bangle.dev/react-menu/floating-menu';
import { LinkSubMenu } from '../@bangle.dev/react-menu/LinkSubMenu';
import { Menu } from '../@bangle.dev/react-menu/Menu';
import { BoldButton, CalloutButton, CodeButton, InlineCommentButton, FloatingLinkButton, HeadingButton, ItalicButton, ParagraphButton, StrikeButton, UnderlineButton, InlineVoteButton } from '../@bangle.dev/react-menu/MenuButtons';
import { MenuGroup } from '../@bangle.dev/react-menu/MenuGroup';
import { InlineCommentSubMenu } from '../inlineComment/InlineComment.components';
import InlineVoteSubMenu from '../inlineVote/components/InlineVoteSubmenu';

type FloatingMenuVariant = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

interface Props {
  enableComments?: boolean,
  enableVoting?: boolean,
  pluginKey: PluginKey,
  inline?: boolean,
  pageType?: PageType
}

export default function FloatingMenuComponent (
  {
    pluginKey, enableComments = true, enableVoting = false, inline = false, pageType }: Props

) {
  const { showMessage } = useSnackbar();
  const { getPagePermissions, currentPageId } = usePages();
  const permissions = currentPageId ? getPagePermissions(currentPageId) : new AllowedPagePermissions();
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const displayInlineCommentButton = !inline && permissions.comment && enableComments && pageType !== 'card_template';

  const displayInlineVoteButton = !inline && permissions.comment && currentUserPermissions?.createVote && enableVoting && pageType !== 'card_template';
  return (
    <FloatingMenu
      menuKey={pluginKey}
      renderMenuType={(menuType) => {
        const { type } = menuType as {type: SubMenu};
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
