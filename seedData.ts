import { Contributor, Page, Space } from 'models';

export const spaces: Space[] = [
  { id: '0', name: 'Our Community', domain: 'demo' },
  { id: '1', name: 'My Workspace', domain: 'my-workspace' },
];

export const contributors: Contributor[] = [
  { id: '0', address: '0x87ddfh6g435D12CE393aBbA3f81fe6C594543sdw', favorites: [], username: 'dolemite', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '0' }, { spaceId: spaces[1].id, type: 'admin', userId: '0' }] },
  { id: '1', address: '0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4', favorites: [], username: 'cerberus', spaceRoles: [{ spaceId: spaces[0].id, type: 'admin', userId: '1' }] },
  { id: '2', address: '0x626a827c90AA620CFD78A8ecda494Edb9a4225D5', favorites: [], username: 'devorein', spaceRoles: [{ spaceId: spaces[0].id, type: 'contributor', userId: '2' }, { spaceId: spaces[1].id, type: 'admin', userId: '2' }] },
  { id: '3', address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2', favorites: [], username: 'mattopoly', spaceRoles: [{ spaceId: spaces[1].id, type: 'contributor', userId: '3' }] }
];

export const activeUser = contributors[0];

export const pages: Page[] = [
  { id: '0', icon: '📌', created: new Date(), content: getMarkdown(), isPublic: false, path: 'first-page', spaceId: '0', title: 'Getting Started' },
  { id: '1', created: new Date(), content: 'Hello world :)', parentPageId: '0', isPublic: false, path: 'second-page', spaceId: '0', title: 'Nested Page' },
  { id: '0', icon: '📌', created: new Date(), content: getMarkdown(), isPublic: false, path: 'first-page', spaceId: '1', title: 'Getting Started Again' }
];


function getMarkdown() {
  return `
## H2 Heading

### H3 Heading

## Marks

_italic_, **Bold**, _underlined_, ~~striked~~, \`code\`, [link](https://en.wikipedia.org/wiki/Main_Page)

## Simple Table

| col1 | col2 | col3 |
| :-- | :-- | :-- |
| row 1 col 1 | row 1 col 2 | row 1 col 3 |
| row 2 col 1 | row 2 col 2 | row 2 col 3 |

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