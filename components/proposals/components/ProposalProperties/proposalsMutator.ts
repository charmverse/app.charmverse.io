/* eslint-disable default-param-last */
import type { PageMeta } from '@charmverse/core/pages';

import octoClient from 'components/common/BoardEditor/focalboard/src/octoClient';
import undoManager from 'components/common/BoardEditor/focalboard/src/undomanager';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { Block } from 'lib/focalboard/block';
import type { Board, IPropertyOption, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView, ISortOption, KanbanCalculationFields } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { FilterGroup } from 'lib/focalboard/filterGroup';
import type { PageContent } from 'lib/prosemirror/interfaces';

export interface BlockChange {
  block: Block;
  newBlock: Block;
}

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
export class ProposalsMutator {
  // callback invoked on property value change
  private onValueChange?: (val: any) => void;

  // other methods related to proposal blocks
  constructor(onValueChange?: (val: any) => void) {
    this.onValueChange = onValueChange;
  }

  private undoGroupId?: string;

  private undoDisplayId?: string;

  private beginUndoGroup(): string | undefined {
    if (this.undoGroupId) {
      Utils.assertFailure('UndoManager does not support nested groups');
      return undefined;
    }
    this.undoGroupId = Utils.createGuid(IDType.None);
    return this.undoGroupId;
  }

  private endUndoGroup(groupId: string) {
    if (this.undoGroupId !== groupId) {
      Utils.assertFailure('Mismatched groupId. UndoManager does not support nested groups');
      return;
    }
    this.undoGroupId = undefined;
  }

  async performAsUndoGroup(actions: () => Promise<void>): Promise<void> {
    const groupId = this.beginUndoGroup();
    try {
      await actions();
    } catch (err) {
      Utils.assertFailure(`ERROR: ${err}`);
    }
    if (groupId) {
      this.endUndoGroup(groupId);
    }
  }

  async updateBlock(newBlock: Block, oldBlock: Block, description: string): Promise<void> {}

  async updateBlocks(newBlocks: Block[], oldBlocks: Block[], description: string): Promise<void> {}

  // eslint-disable-next-line no-shadow
  async insertBlock(
    block: Block,
    description = 'add',
    afterRedo?: (block: Block) => Promise<void>,
    beforeUndo?: (block: Block) => Promise<void>
  ) {}

  // eslint-disable-next-line no-shadow
  async insertBlocks(
    blocks: Block[],
    description = 'add',
    afterRedo?: (blocks: Block[]) => Promise<void>,
    beforeUndo?: () => Promise<void>
  ) {}

  async deleteBlock(
    block: Block,
    description?: string,
    beforeRedo?: () => Promise<void>,
    afterUndo?: () => Promise<void>
  ) {}

  async deleteBlocks(
    blockIds: string[],
    description = 'delete blocks',
    beforeRedo?: () => Promise<void>,
    afterUndo?: () => Promise<void>
  ) {}

  async changeTitle(blockId: string, oldTitle: string, newTitle: string, description = 'change title') {}

  async setDefaultTemplate(
    blockId: string,
    oldTemplateId: string,
    templateId: string,
    description = 'set default template'
  ) {}

  async clearDefaultTemplate(blockId: string, oldTemplateId: string, description = 'set default template') {}

  async changeIcon(blockId: string, oldIcon: string | undefined, icon: string, description = 'change icon') {}

  async changeHeaderImage(
    blockId: string,
    oldHeaderImage: string | undefined | null,
    headerImage: string | null,
    description = 'change cover'
  ) {}

  async changeDescription(
    blockId: string,
    oldBlockDescription: PageContent | undefined,
    blockDescription: PageContent,
    description = 'change description'
  ) {}

  async showDescription(boardId: string, oldShowDescription: boolean, showDescription = true, description?: string) {}

  async changeCardContentOrder(
    cardId: string,
    oldContentOrder: (string | string[])[],
    contentOrder: (string | string[])[],
    description = 'reorder'
  ): Promise<void> {}

  // Property Templates

  async insertPropertyTemplate(
    board: Board,
    activeView: BoardView,
    index = -1,
    template?: IPropertyTemplate
  ): Promise<string> {
    const newTemplate = { id: '' };

    return newTemplate.id;
  }

  async duplicatePropertyTemplate(board: Board, activeView: BoardView, propertyId: string) {}

  async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {}

  async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {}

  // Properties

  async insertPropertyOption(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    description = 'add option'
  ) {}

  async changePropertyOptionOrder(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    destIndex: number
  ) {}

  async changePropertyOptionValue(
    board: Board,
    propertyTemplate: IPropertyTemplate,
    option: IPropertyOption,
    value: string
  ) {}

  async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {}

  async changePropertyOption(board: Board, template: IPropertyTemplate, updatedOption: IPropertyOption) {}

  changePropertyValue(
    card: Card,
    propertyId: string,
    value?: string | string[] | number,
    description = 'change property',
    mutate = true
  ) {}

  async changePropertyTypeAndName(
    board: Board,
    cards: Card[],
    propertyTemplate: IPropertyTemplate,
    newType: PropertyType,
    newName: string,
    views: BoardView[]
  ) {}

  // Views

  async changeViewSortOptions(
    viewId: string,
    oldSortOptions: ISortOption[],
    sortOptions: ISortOption[]
  ): Promise<void> {}

  async changeViewFilter(viewId: string, oldFilter: FilterGroup, filter: FilterGroup): Promise<void> {}

  async changeViewGroupById(viewId: string, oldGroupById: string | undefined, groupById: string): Promise<void> {}

  async changeViewDateDisplayPropertyId(
    viewId: string,
    oldDateDisplayPropertyId: string | undefined,
    dateDisplayPropertyId: string
  ): Promise<void> {}

  async changeBoardViewsOrder(
    boardId: string,
    currentViewIds: string[],
    droppedView: BoardView,
    dropzoneView: BoardView
  ) {}

  async changeViewVisiblePropertiesOrder(
    viewId: string,
    visiblePropertyIds: string[],
    template: IPropertyTemplate,
    destIndex: number,
    description = 'change property order'
  ): Promise<void> {}

  async changeViewVisibleProperties(
    viewId: string,
    oldVisiblePropertyIds: string[],
    visiblePropertyIds: string[],
    description = 'show / hide property'
  ): Promise<void> {}

  async changeViewVisibleOptionIds(
    viewId: string,
    oldVisibleOptionIds: string[],
    visibleOptionIds: string[],
    description = 'reorder'
  ): Promise<void> {}

  async changeViewHiddenOptionIds(
    viewId: string,
    oldHiddenOptionIds: string[],
    hiddenOptionIds: string[],
    description = 'reorder'
  ): Promise<void> {}

  async changeViewKanbanCalculations(
    viewId: string,
    oldCalculations: Record<string, KanbanCalculationFields>,
    calculations: Record<string, KanbanCalculationFields>,
    description = 'updated kanban calculations'
  ): Promise<void> {}

  async toggleColumnWrap(
    viewId: string,
    templateId: string,
    currentColumnWrappedIds: string[],
    description = 'toggle column wrap'
  ): Promise<void> {}

  async hideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {}

  async unhideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {}

  changeViewCardOrder(view: BoardView, cardOrder: string[], description = 'reorder', mutate = true) {}

  // Duplicate

  async duplicateCard({
    cardId,
    board,
    description = 'duplicate card',
    asTemplate = false,
    afterRedo,
    beforeUndo,
    cardPage
  }: {
    cardId: string;
    board: Board;
    cardPage: PageMeta;
    description?: string;
    asTemplate?: boolean;
    afterRedo?: (newCardId: string) => Promise<void>;
    beforeUndo?: () => Promise<void>;
  }) {}

  // Other methods

  // Not a mutator, but convenient to put here since Mutator wraps OctoClient
  async exportArchive(boardID?: string): Promise<Block[]> {
    return octoClient.exportArchive(boardID);
  }

  // Not a mutator, but convenient to put here since Mutator wraps OctoClient
  async importFullArchive(blocks: readonly Block[]): Promise<Response> {
    return octoClient.importFullArchive(blocks);
  }

  get canUndo(): boolean {
    return undoManager.canUndo;
  }

  get canRedo(): boolean {
    return undoManager.canRedo;
  }

  get undoDescription(): string | undefined {
    return undoManager.undoDescription;
  }

  get redoDescription(): string | undefined {
    return undoManager.redoDescription;
  }

  async undo() {
    await undoManager.undo();
  }

  async redo() {
    await undoManager.redo();
  }
}
