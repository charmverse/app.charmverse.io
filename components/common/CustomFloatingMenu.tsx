import { Menu } from "components/@bangle.dev/react-menu/Menu";
import { BlockquoteButton, BoldButton, CodeButton, HeadingButton, ItalicButton, ParagraphButton } from "components/@bangle.dev/react-menu/MenuButtons";
import { MenuGroup } from "components/@bangle.dev/react-menu/MenuGroup";

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