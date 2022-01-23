import {
  blockquote,
  bold,
  bulletList,
  code,
  codeBlock,
  hardBreak,
  heading,
  horizontalRule,
  image,
  italic,
  link,
  listItem,
  orderedList,
  paragraph,
  strike,
  underline
} from '@bangle.dev/base-components';
import {
  BangleEditor, PluginKey, SpecRegistry
} from '@bangle.dev/core';
import '@bangle.dev/core/style.css';
import { emoji } from '@bangle.dev/emoji';
import { markdownParser, markdownSerializer } from '@bangle.dev/markdown';
import { EditorView, NodeSelection } from '@bangle.dev/pm';
import { BangleEditor as ReactBangleEditor, useEditorState } from '@bangle.dev/react';
import { EmojiSuggest, emojiSuggest } from '@bangle.dev/react-emoji-suggest';
import { floatingMenu, FloatingMenu } from '@bangle.dev/react-menu';
import '@bangle.dev/react-menu/style.css';
import '@bangle.dev/tooltip/style.css';
import gemojiData from 'emoji-lookup-data/data/gemoji.json';
import { ActionKind, autocomplete, closeAutocomplete, FromTo, Options } from "prosemirror-autocomplete";
import { DropdownGroup } from '../../components/types';
import dropdownGroups from "../dropdown.json";

const menuKey = new PluginKey('menuKey');

const picker = {
  view: null as EditorView | null,
  open: false,
  current: 0,
  range: null as FromTo | null,
};

const totalDropdownItems = dropdownGroups.reduce((current, dropdownGroup) => current + dropdownGroup.items.length, 0);
const dropdownItems: HTMLDivElement[] = [];

function placeSuggestion() {
  const suggestion = document.querySelector('#suggestion') as HTMLDivElement;
  suggestion.style.display = picker.open ? 'block' : 'none';
  const rect = document.getElementsByClassName('autocomplete')[0]?.getBoundingClientRect();
  console.log({ rect });

  if (!rect) return;
  suggestion.style.top = `${rect.top + rect.height}px`;
  suggestion.style.left = `${rect.left}px`;

  dropdownItems.forEach((dropdownItem, dropdownItemIndex) => {
    dropdownItem.classList[dropdownItemIndex === picker.current ? 'add' : 'remove']('selected')
  });
}

const options: Options = {
  reducer: (action) => {
    picker.view = action.view;
    switch (action.kind) {
      case ActionKind.open:
        picker.current = 0;
        picker.open = true;
        picker.range = action.range;
        placeSuggestion();
        return true;
      case ActionKind.close:
        picker.open = false;
        placeSuggestion();
        return true;
      case ActionKind.up:
        console.log(action);
        picker.current -= 1;
        picker.current += totalDropdownItems; // negative modulus doesn't work
        picker.current %= totalDropdownItems;
        placeSuggestion();
        return true;
      case ActionKind.down:
        picker.current += 1;
        picker.current %= totalDropdownItems;
        placeSuggestion();
        return true;
      case ActionKind.enter: {
        const tr = action.view.state.tr
          .deleteRange(action.range.from, action.range.to)
          .insertText(`You can define this ${action.type ? `${action.type?.name} ` : ''}action!`);
        action.view.dispatch(tr);
        return true;
      }
      default:
        return false;
    }
  },
  triggers: [
    { name: 'command', trigger: '/', decorationAttrs: { class: 'command' } },
  ],
};

function suggestionItemClickHandler() {
  console.log(123);
  if (!picker.view) return;
  closeAutocomplete(picker.view);
  picker.open = false;
  placeSuggestion();
  if (!picker.range) return;
  const tr = picker.view.state.tr
    .deleteRange(picker.range.from, picker.range.to)
    .insertText(`Clicked`);
  picker.view.dispatch(tr);
  picker.view.focus();
}

const suggestionComponent = <div id="suggestion" style={{ display: "none" }}>
  {(dropdownGroups as DropdownGroup[]).map(dropdownGroup => <div className="suggestion-group" key={dropdownGroup.group}>
    <div className="suggestion-group-name">{dropdownGroup.group}</div>
    <div className="suggestion-group-items">
      {dropdownGroup.items.map(item => {
        const dropdownItemComponent = <div ref={(element) => {
          if (element) {
            dropdownItems.push(element);
          }
        }} key={`${dropdownGroup.group}.${item.label}`} onClick={suggestionItemClickHandler} className="suggestion-group-item">
          <span className="suggestion-group-item-icon">{item.icon}</span>
          <span className="suggestion-group-item-label">{item.label}</span>
        </div>;
        return dropdownItemComponent;
      })}
    </div>
  </div>)}
</div>

const emojiSuggestKey = new PluginKey('emojiSuggestKey');

const emojiData = Object.values(
  gemojiData.reduce((prev, obj) => {
    if (!prev[obj.category]) {
      prev[obj.category] = { name: obj.category, emojis: [] };
    }
    prev[obj.category].emojis.push([obj.aliases[0], obj.emoji]);

    return prev;
  }, {} as Record<string, { name: string, emojis: [string, string][] }>),
);

const getEmojiByAlias = (emojiAlias: string) => {
  for (const { emojis } of emojiData) {
    const match = emojis.find((e) => e[0] === emojiAlias);
    if (match) {
      return match;
    }
  }
};

const specRegistry = new SpecRegistry([
  blockquote.spec(),
  bold.spec(),
  bulletList.spec(),
  hardBreak.spec(),
  horizontalRule.spec(),
  image.spec(),
  italic.spec(),
  link.spec(),
  listItem.spec(),
  orderedList.spec(),
  paragraph.spec(),
  strike.spec(),
  underline.spec(),
  emoji.spec({
    getEmoji: (emojiAlias) =>
      (getEmojiByAlias(emojiAlias) || ['question', '❓'])[1],
  }),
  emojiSuggest.spec({ markName: 'emojiSuggest' }),
  code.spec(),
  codeBlock.spec(),
  heading.spec(),
]);
const parser = markdownParser(specRegistry);
const serializer = markdownSerializer(specRegistry);


export default function Editor() {
  const state = useEditorState({
    specRegistry,
    plugins: () => [
      blockquote.plugins(),
      bold.plugins(),
      bulletList.plugins(),
      code.plugins(),
      codeBlock.plugins(),
      hardBreak.plugins(),
      heading.plugins(),
      horizontalRule.plugins(),
      image.plugins(),
      italic.plugins(),
      link.plugins(),
      listItem.plugins(),
      orderedList.plugins(),
      paragraph.plugins(),
      strike.plugins(),
      underline.plugins(),
      ...autocomplete(options),
      emoji.plugins(),
      emojiSuggest.plugins({
        key: emojiSuggestKey,
        getEmojiGroups: (queryText) => {
          if (!queryText) {
            return emojiData;
          }
          return emojiData
            .map((group) => {
              return {
                name: group.name,
                emojis: group.emojis.filter(([emojiAlias]) =>
                  emojiAlias.includes(queryText),
                ),
              };
            })
            .filter((group) => group.emojis.length > 0);
        },
        markName: 'emojiSuggest',
        tooltipRenderOpts: {
          placement: 'bottom',
        },
      }),
      floatingMenu.plugins({
        key: menuKey,
        calculateType: (state,) => {
          if (state.selection.empty) {
            return null;
          }

          if ((state.selection as NodeSelection)?.node?.type?.name === "image") {
            return null;
          }
          return 'defaultMenu'
        }
      }),
    ],
    initialValue: parser.parse(getMarkdown()),
  });

  return <ReactBangleEditor state={state}>
    <FloatingMenu menuKey={menuKey} />
    <EmojiSuggest emojiSuggestKey={emojiSuggestKey} />
    {suggestionComponent}
  </ReactBangleEditor>
}

export function serializeMarkdown(editor: BangleEditor) {
  return serializer.serialize(editor.view.state.doc);
}

function getMarkdown() {
  return `
## H2 Heading

### H3 Heading

## Marks

_italic_, **Bold**, _underlined_, ~~striked~~, \`code\`, [link](https://en.wikipedia.org/wiki/Main_Page)

## GFM Todo Lists

- [x] Check out BangleJS

- [ ] Walk the cat

- [ ] Drag these lists by dragging the square up or down.

- [ ] Move these lists with shortcut \`Option-ArrowUp\`. You can move any node (yes headings too) with this shortcut.

## Unordered Lists

- This is an ordered list

  - I am a nested ordered list

  - I am another nested one

    - Bunch of nesting right?

## Ordered Lists

1. Bringing order to the world.

2. Nobody remembers who came second.

   1. We can cheat to become first by nesting.

      - Oh an you can mix and match ordered unordered.

## Image
You can also directly paste images.
![](https://user-images.githubusercontent.com/6966254/101979122-f4405e80-3c0e-11eb-9bf8-9af9b1ddc94f.png)


## Blockquote

> I am a blockquote, trigger me by typing > on a new line

## Code Block

\`\`\`
// This is a code block
function foo() {
  console.log('Hello world!')
}
\`\`\`

## Paragraph

I am a boring paragraph

## Horizontal Break
---
`;
}