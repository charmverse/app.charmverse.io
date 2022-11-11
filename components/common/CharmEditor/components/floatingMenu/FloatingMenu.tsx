import type { PluginKey } from '@bangle.dev/pm';
import { FloatingMenu } from '@bangle.dev/react-menu';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Button from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import InlineCommandPalette from '../../components/inlinePalette/components/InlineCommandPalette';
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
  nestedPagePluginKey?: PluginKey<any, any>;
  disableNestedPage?: boolean;
}

export default function FloatingMenuComponent (
  {
    pluginKey, enableComments = true, enableVoting = false, inline = false, pagePermissions, nestedPagePluginKey, disableNestedPage = false }: Props
) {
  const { showMessage } = useSnackbar();
  const popupState = usePopupState({ variant: 'popover', popupId: 'commands-menu' });
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;
  const displayInlineVoteButton = !inline && pagePermissions?.create_poll && enableVoting;
  const [activeItem, setActiveItem] = useState('Text');
  const handleActiveItem = (item: string) => setActiveItem(item);

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
            <Menu type={type}>
              <MenuGroup>
                <Tooltip title={<Typography component='div'>Turn into</Typography>}>
                  <Button
                    {...bindTrigger(popupState)}
                    endIcon={<ArrowDropDown />}
                    size='small'
                    disableElevation
                    variant='text'
                    color='inherit'
                    padding='0'
                    sx={{ padding: 0 }}
                  >
                    {activeItem}
                  </Button>
                </Tooltip>
                <InlineCommandPalette
                  nestedPagePluginKey={nestedPagePluginKey}
                  disableNestedPage={disableNestedPage}
                  externalPopupState={popupState}
                  size='small'
                  handleActiveItem={handleActiveItem}
                />
              </MenuGroup>
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
