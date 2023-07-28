/* eslint-disable react/no-unused-prop-types */
import { usePluginState } from '@bangle.dev/react';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PluginKey } from 'prosemirror-state';
import reactDOM from 'react-dom';

import { InlinePalletteFloatingMenu } from 'components/common/CharmEditor/components/inlinePalette/InlinePalletteFloatingMenu';

import { InlineCommentSubMenu } from '../inlineComment/inlineComment.components';
import { TextColorMenuDropdown } from '../textColor/ColorMenuDropdown';

import type { SubMenu } from './floating-menu';
import { LinkSubMenu } from './LinkSubMenu';
import { Menu } from './Menu';
import {
  BoldButton,
  CalloutButton,
  CodeButton,
  FloatingLinkButton,
  HeadingButton,
  InlineCommentButton,
  ItalicButton,
  ParagraphButton,
  StrikeButton,
  TextColorButton,
  UnderlineButton
} from './MenuButtons';
import { MenuGroup } from './MenuGroup';

type FloatingMenuVariant = 'defaultMenu' | 'inlineCommentSubMenu' | 'commentOnlyMenu';

type MenuProps = {
  enableComments?: boolean;
  enableVoting?: boolean;
  pluginKey: PluginKey;
  inline?: boolean;
  pagePermissions?: PagePermissionFlags;
  nestedPagePluginKey?: PluginKey<any>;
  disableNestedPage?: boolean;
  palettePluginKey?: PluginKey;
  pageId?: string;
};

export default function FloatingMenuComponent(props: MenuProps) {
  const menuState = usePluginState(props.pluginKey);
  const renderElement = MenuByType({ ...props });
  return renderElement ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM) : null;
}

function MenuByType(props: MenuProps) {
  const {
    palettePluginKey,
    pluginKey,
    inline,
    pagePermissions,
    enableComments,
    nestedPagePluginKey,
    disableNestedPage,
    pageId
  } = props;
  const { type } = usePluginState(props.pluginKey) as { type: SubMenu; show: boolean };
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;

  if ((type as FloatingMenuVariant) === 'commentOnlyMenu' && pagePermissions?.comment) {
    return (
      <Menu>
        <InlineCommentButton enableComments menuKey={pluginKey} />
      </Menu>
    );
  }

  if (type === 'defaultMenu') {
    return (
      <Menu type={type} inline={inline}>
        {!inline && palettePluginKey && (
          <MenuGroup>
            <InlinePalletteFloatingMenu
              palettePluginKey={palettePluginKey}
              nestedPagePluginKey={nestedPagePluginKey}
              pageId={pageId}
              pluginKey={pluginKey}
              disableNestedPage={disableNestedPage}
            />
          </MenuGroup>
        )}
        <MenuGroup isLastGroup={inline}>
          <BoldButton />
          <ItalicButton />
          <UnderlineButton />
          <StrikeButton />
          <CodeButton />
          <FloatingLinkButton menuKey={pluginKey} />
          {displayInlineCommentButton && <InlineCommentButton enableComments menuKey={pluginKey} />}
        </MenuGroup>
        {!inline && (
          <MenuGroup>
            <TextColorMenuDropdown>
              <TextColorButton />
            </TextColorMenuDropdown>
          </MenuGroup>
        )}
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
        <LinkSubMenu />
      </Menu>
    );
  }

  if (type === 'inlineCommentSubMenu' && !inline) {
    return (
      <Menu type={type} noScroll>
        <InlineCommentSubMenu pageId={pageId} pluginKey={pluginKey} />
      </Menu>
    );
  }

  return null;
}
