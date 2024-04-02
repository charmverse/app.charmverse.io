import type { SpaceOperation } from '@charmverse/core/prisma';
import type { PluginKey, EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export const PALETTE_ITEM_REGULAR_TYPE = 'REGULAR_TYPE';
export const PALETTE_ITEM_HINT_TYPE = 'HINT_TYPE';
const allTypes = [PALETTE_ITEM_HINT_TYPE, PALETTE_ITEM_REGULAR_TYPE];

export type PromisedCommand = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => boolean | Promise<boolean>;

export interface InlinePaletteItem {
  // eslint-disable-next-line no-use-before-define
  editorExecuteCommand: EditorExecuteCommand;
}

export type EditorExecuteCommand = (arg: {
  item: InlinePaletteItem;
  itemIndex: number;
  palettePluginKey: PluginKey;
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
  disabled?: ((state: EditorState) => boolean) | boolean;
  hidden?: boolean | ((state: EditorState) => boolean);
  editorExecuteCommand: EditorExecuteCommand;
  skipFiltering?: boolean;
  _isItemDisabled?: boolean;
  showInFloatingMenu?: boolean; // make it appear in the floating menu to convert highlighted text
  icon?: JSX.Element | null | undefined;
  priority?: number;
}

export interface PaletteItemType extends PaletteItemTypeNoGroup {
  group: string;
}

export class PaletteItem implements PaletteItemType {
  static create(obj: PaletteItemType) {
    return new PaletteItem(obj);
  }

  _isItemDisabled?: boolean;

  uid: string;

  title: string;

  type: string;

  description: string;

  keywords: string[];

  disabled: ((state: EditorState) => boolean) | boolean;

  hidden: boolean | ((state: EditorState) => boolean);

  editorExecuteCommand: EditorExecuteCommand;

  group: string;

  skipFiltering: boolean;

  showInFloatingMenu?: boolean; // make it appear in the floating menu to convert highlighted text

  icon?: JSX.Element | null | undefined;

  keybinding?: string;

  priority?: number;

  constructor(obj: PaletteItemType) {
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
      showInFloatingMenu,
      icon,
      priority,
      ...otherKeys
    } = obj;

    if (Object.keys(otherKeys).length > 0) {
      throw new Error(`PaletteItem: the following fields are not recognized "${Object.keys(otherKeys).join(',')}"`);
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
    this.priority = priority;
    this.showInFloatingMenu = showInFloatingMenu;
  }
}
