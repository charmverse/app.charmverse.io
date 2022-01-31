import { PluginKey } from '@bangle.dev/core';
import { Node, ResolvedPos } from '@bangle.dev/pm';
import { FloatingMenu, floatingMenu } from '@bangle.dev/react-menu';
import { NodeSelection } from 'prosemirror-state';
import { Menu } from './@bangle.dev/react-menu/Menu';
import { BlockquoteButton, BoldButton, CodeButton, HeadingButton, ItalicButton, ParagraphButton, StrikeButton, UnderlineButton } from './@bangle.dev/react-menu/MenuButtons';
import { MenuGroup } from './@bangle.dev/react-menu/MenuGroup';

const menuKey = new PluginKey('menuKey');

export default function FloatingMenuComponent () {
  return (
    <FloatingMenu
      menuKey={menuKey}
      renderMenuType={({ type }) => {
        if (type === 'defaultMenu') {
          return (
            <Menu>
              <MenuGroup>
                <BoldButton />
                <ItalicButton />
                <CodeButton />
                <StrikeButton />
                <UnderlineButton />
              </MenuGroup>
              <MenuGroup isLastGroup>
                <ParagraphButton />
                <BlockquoteButton />
                <HeadingButton level={1} />
                <HeadingButton level={2} />
                <HeadingButton level={3} />
              </MenuGroup>
            </Menu>
          );
        }
        return null;
      }}
    />
  );
}

export const floatingMenuPlugin = () => {
  return floatingMenu.plugins({
    key: menuKey,
    calculateType: state => {
      // if inside a table, first check to see if we are resizing or not
      const isInsideTable = state.selection.$anchor.parent.type.name.match(/^(table_cell|table_header)$/);
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
      if (state.selection.empty || (state.selection as NodeSelection)?.node?.type?.name.match(/(image)/)) {
        return null;
      }
      return 'defaultMenu';
    }
  });
};
