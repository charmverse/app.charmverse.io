/* eslint-disable react/no-unused-prop-types */
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { PluginKey } from 'prosemirror-state';
import { useState } from 'react';
import reactDOM from 'react-dom';

import Button from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

import { InlineCommentSubMenu } from '../inlineComment/inlineComment.components';
import InlineCommandPalette from '../inlinePalette/components/InlineCommandPalette';
import InlineVoteSubMenu from '../inlineVote/components/InlineVoteSubmenu';

import type { SubMenu } from './floating-menu';
import { hasComponentInSchema } from './helper';
import { LinkSubMenu } from './LinkSubMenu';
import { Menu } from './Menu';
import {
  BoldButton,
  CalloutButton,
  CodeButton,
  FloatingLinkButton,
  HeadingButton,
  InlineCommentButton,
  InlineVoteButton,
  ItalicButton,
  ParagraphButton,
  StrikeButton,
  UnderlineButton
} from './MenuButtons';
import { MenuGroup } from './MenuGroup';

type FloatingMenuVariant = 'defaultMenu' | 'linkSubMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

type MenuProps = {
  enableComments?: boolean;
  enableVoting?: boolean;
  pluginKey: PluginKey;
  inline?: boolean;
  pagePermissions?: IPagePermissionFlags;
  nestedPagePluginKey?: PluginKey<any>;
  disableNestedPage?: boolean;
};

export default function FloatingMenuComponent(props: MenuProps) {
  const menuState = usePluginState(props.pluginKey);
  const renderElement = MenuByType({ ...props });
  return renderElement ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM) : null;

  // return <FloatingMenu menuKey={pluginKey} renderMenuType={} />;
}

function MenuByType(props: MenuProps) {
  const { pluginKey, inline, pagePermissions, enableComments, enableVoting, nestedPagePluginKey, disableNestedPage } =
    props;
  const { type } = usePluginState(props.pluginKey) as { type: SubMenu };
  const { showMessage } = useSnackbar();

  const popupState = usePopupState({ variant: 'popover', popupId: 'commands-menu' });
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;
  const displayInlineVoteButton = !inline && pagePermissions?.create_poll && enableVoting;
  const [activeItem, setActiveItem] = useState('Text');
  const handleActiveItem = (item: string) => setActiveItem(item);

  if ((type as FloatingMenuVariant) === 'commentOnlyMenu' && pagePermissions?.comment) {
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
}
