import { EditorState, EditorView, Transaction } from '@bangle.dev/pm';
import { InlinePaletteItem } from './hooks';

export const PALETTE_ITEM_REGULAR_TYPE = 'REGULAR_TYPE';
export const PALETTE_ITEM_HINT_TYPE = 'HINT_TYPE';
const allTypes = [PALETTE_ITEM_HINT_TYPE, PALETTE_ITEM_REGULAR_TYPE];

export type PromisedCommand = ((state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean | Promise<boolean>)

type EditorExecuteCommand = (arg: {
  item: InlinePaletteItem;
  itemIndex: number;
}) => PromisedCommand;

export interface PaletteItemType {
  uid: string;
  title: string;
  type?: string;
  description: string;
  keywords?: string[];
  disabled?: ((state: EditorState<any>) => boolean) | boolean;
  hidden?: boolean | ((state: EditorState) => boolean);
  editorExecuteCommand: EditorExecuteCommand;
  group: string;
  highPriority?: boolean;
  skipFiltering?: boolean;
  _isItemDisabled?: boolean
  icon?: JSX.Element | null | undefined
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

  highPriority: boolean;

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
      editorExecuteCommand,
      group,
      highPriority,
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
    this.highPriority = highPriority ?? false;
    this.skipFiltering = skipFiltering ?? false;
    this._isItemDisabled = false;
    this.icon = icon;
  }
}
