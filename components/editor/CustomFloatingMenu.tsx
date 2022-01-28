import { MenuGroup } from "components/editor/@bangle.dev/react-menu/MenuGroup";
import { Menu } from "./@bangle.dev/react-menu/Menu";
import { BlockquoteButton, BoldButton, CodeButton, HeadingButton, ItalicButton, ParagraphButton } from "./@bangle.dev/react-menu/MenuButtons";

export function CustomFloatingMenu() {
  return (
    <Menu>
      <MenuGroup>
        <BoldButton />
        <ItalicButton />
        <CodeButton />
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