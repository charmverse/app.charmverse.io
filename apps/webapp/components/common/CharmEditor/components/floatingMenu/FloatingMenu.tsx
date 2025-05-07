/* eslint-disable react/no-unused-prop-types */
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma-client';
import type { PluginKey } from 'prosemirror-state';
import reactDOM from 'react-dom';

import { InlinePalletteFloatingMenu } from 'components/common/CharmEditor/components/inlinePalette/InlinePalletteFloatingMenu';

import { usePluginState } from '../@bangle.dev/react/hooks';
import { InlineCommentSubMenu } from '../inlineComment/components/InlineCommentSubMenu';
import { TextColorMenuDropdown } from '../textColor/ColorMenuDropdown';

import type { SubMenu } from './floatingMenuPlugin';
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
  linkedPagePluginKey?: PluginKey<any>;
  disableNestedPage?: boolean;
  palettePluginKey?: PluginKey;
  pageId?: string;
  pageType?: 'post' | PageType;
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
    linkedPagePluginKey,
    disableNestedPage,
    pageId
  } = props;
  const { type } = usePluginState(props.pluginKey) as { type: SubMenu; show: boolean };
  const displayInlineCommentButton = !inline && pagePermissions?.comment && enableComments;

  if ((type as FloatingMenuVariant) === 'commentOnlyMenu' && pagePermissions?.comment) {
    return (
      <Menu>
        <InlineCommentButton menuKey={pluginKey} />
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
              linkedPagePluginKey={linkedPagePluginKey}
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
          {displayInlineCommentButton && <InlineCommentButton menuKey={pluginKey} />}
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
      <Menu type={type} noScroll data-test='inline-comment-menu'>
        <InlineCommentSubMenu pageType={props.pageType} pageId={pageId} pluginKey={pluginKey} />
      </Menu>
    );
  }

  return null;
}
