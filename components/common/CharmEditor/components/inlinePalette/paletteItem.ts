import type { EditorState, EditorView, Transaction } from '@bangle.dev/pm';
import type { SpaceOperation } from '@prisma/client';

import type { InlinePaletteItem } from './hooks';

export const PALETTE_ITEM_REGULAR_TYPE = 'REGULAR_TYPE';
export const PALETTE_ITEM_HINT_TYPE = 'HINT_TYPE';
const allTypes = [PALETTE_ITEM_HINT_TYPE, PALETTE_ITEM_REGULAR_TYPE];

export type PromisedCommand = ((state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean | Promise<boolean>)

type EditorExecuteCommand = (arg: {
  item: InlinePaletteItem;
  itemIndex: number;
}) => PromisedCommand;

/**
 * @requiredSpacePermission Optional parameter. If this is provided, the palette item should not be available to a user without this space permission.
 */
export interface PaletteItemTypeNoGroup {
  uid: string;
  title: string;
  type?: string;
  requiredSpacePermission?: SpaceOperation;
  description: string;
  keywords?: string[];
  disabled?: ((state: EditorState<any>) => boolean) | boolean;
  hidden?: boolean | ((state: EditorState) => boolean);
  editorExecuteCommand: EditorExecuteCommand;
  skipFiltering?: boolean;
  _isItemDisabled?: boolean;
  icon?: JSX.Element | null | undefined;
}

export interface PaletteItemType extends PaletteItemTypeNoGroup {
  group: string;
}

export class PaletteItem implements PaletteItemType {
  static create (obj: PaletteItemType) {
    return new PaletteItem(obj);
  }

  _isItemDisabled?: boolean;

  uid: string;

  title: string;

  type: string;

  description: string;

  keywords: string[];

  disabled: ((state: EditorState<any>) => boolean) | boolean;

  hidden: boolean | ((state: EditorState) => boolean);

  editorExecuteCommand: EditorExecuteCommand;

  group: string;

  skipFiltering: boolean;

  icon?: JSX.Element | null | undefined;

  keybinding?: string;

  constructor (obj: PaletteItemType) {
    const {
      uid,
      title,
      type = PALETTE_ITEM_REGULAR_TYPE,
      description,
      keywords,
      disabled,
      hidden,
      // Prevent required space permission from triggering error
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requiredSpacePermission,
      editorExecuteCommand,
      group,
      skipFiltering,
      icon,
      ...otherKeys
    } = obj;

    if (Object.keys(otherKeys).length > 0) {
      throw new Error(
        `PaletteItem: the following fields are not recognized "${Object.keys(
          otherKeys
        ).join(',')}"`
      );
    }
    if (!allTypes.includes(type)) {
      throw new Error(`PaletteItem: Unknown type ${type}`);
    }
    if (!group) {
      throw new Error('PaletteItem: group is required');
    }

    this.uid = uid;
    this.title = title;
    this.type = type;
    this.description = description;
    this.keywords = keywords ?? [];
    this.disabled = disabled ?? false;
    this.hidden = hidden ?? false;
    this.editorExecuteCommand = editorExecuteCommand;
    this.group = group;
    this.skipFiltering = skipFiltering ?? false;
    this._isItemDisabled = false;
    this.icon = icon;
  }
}
