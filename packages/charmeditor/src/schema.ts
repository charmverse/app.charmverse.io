import type { Schema } from 'prosemirror-model';

import { buildSchema } from './buildSchema';
import * as bold from './extensions/bold';
import * as bulletList from './extensions/bulletList';
import * as doc from './extensions/doc';
import * as hardBreak from './extensions/hardBreak';
import * as italic from './extensions/italic';
import * as link from './extensions/link/linkSpec';
import * as listItem from './extensions/listItem/listItemSpec';
import * as paragraph from './extensions/paragraph';
import * as tabIndent from './extensions/tabIndent';
import * as text from './extensions/text';

export type ExtensionGroup = 'product_updates' | 'tokengate_message';

export const groups: Record<ExtensionGroup, Schema> = {
  product_updates: buildSchema([
    // force the first element to be a bullet_list
    doc.spec({ content: 'bullet_list' }),
    bold.spec(),
    bulletList.spec,
    hardBreak.spec,
    italic.spec(),
    listItem.spec,
    paragraph.spec,
    text.spec,
    tabIndent.spec
  ]),
  tokengate_message: buildSchema([
    doc.spec(),
    bold.spec(),
    bulletList.spec,
    hardBreak.spec,
    italic.spec(),
    link.spec(),
    listItem.spec,
    paragraph.spec,
    text.spec,
    tabIndent.spec
  ])
};
