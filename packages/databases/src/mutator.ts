/* eslint-disable default-param-last */

import type { PageContent } from '@packages/charmeditor/interfaces';

import type { UIBlockWithDetails, BlockPatch } from './block';
import { createPatchesFromBlocks } from './block';
import type { Board, IPropertyOption, IPropertyTemplate, PropertyType, RelationPropertyData } from './board';
import { createBoard } from './board';
import type { BoardView, ISortOption, KanbanCalculationFields } from './boardView';
import { createBoardView } from './boardView';
import type { Card } from './card';
import { createCard } from './card';
import charmClient from './charmClient';
import { Constants } from './constants';
import type { FilterClause } from './filterClause';
import type { FilterGroup } from './filterGroup';
import { OctoUtils } from './octoUtils';
import { publishIncrementalUpdate } from './publisher';
import undoManager from './undomanager';
import { Utils } from './utils';

export interface BlockChange {
  block: UIBlockWithDetails;
  newBlock: UIBlockWithDetails;
}

type BlockUpdater = (blocks: UIBlockWithDetails[]) => void;

export type MutatorUpdaters = {
  patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void>;
  patchBlocks(blocks: UIBlockWithDetails[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void>;
  insertBlock?: (block: UIBlockWithDetails, updater: BlockUpdater) => Promise<UIBlockWithDetails[]>;
  insertBlocks?: (fbBlocks: UIBlockWithDetails[], updater: BlockUpdater) => Promise<UIBlockWithDetails[]>;
  deleteBlock?: (blockId: string, updater: BlockUpdater) => Promise<void>;
  deleteBlocks?: (blockIds: string[], updater: BlockUpdater) => Promise<void>;
};

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
export class Mutator {
  private undoGroupId?: string;

  private undoDisplayId?: string;

  private customMutatorUpdaters: MutatorUpdaters | null = null;

  get patchBlock() {
    return this.customMutatorUpdaters?.patchBlock || charmClient.patchBlock;
  }

  get patchBlocks() {
    return this.customMutatorUpdaters?.patchBlocks || charmClient.patchBlocks;
  }

  get insertBlockApi() {
    return this.customMutatorUpdaters?.insertBlock || charmClient.insertBlock;
  }

  get insertBlocksApi() {
    return this.customMutatorUpdaters?.insertBlocks || charmClient.insertBlocks;
  }

  get deleteBlockApi() {
    return this.customMutatorUpdaters?.deleteBlock || charmClient.deleteBlock;
  }

  get deleteBlocksApi() {
    return this.customMutatorUpdaters?.deleteBlocks || charmClient.deleteBlocks;
  }

  setCustomMutatorUpdaters(updaters: MutatorUpdaters | null) {
    this.customMutatorUpdaters = updaters;
  }

  private beginUndoGroup(): string | undefined {
    if (this.undoGroupId) {
      Utils.assertFailure('UndoManager does not support nested groups');
      return undefined;
    }
    this.undoGroupId = Utils.createGuid();
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

  async updateBlock(newBlock: UIBlockWithDetails, oldBlock: UIBlockWithDetails, description: string): Promise<void> {
    const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlock);

    await undoManager.perform(
      async () => {
        await this.patchBlock(newBlock.id, updatePatch, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(oldBlock.id, undoPatch, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  async updateBlocks(
    newBlocks: UIBlockWithDetails[],
    oldBlocks: UIBlockWithDetails[],
    description: string
  ): Promise<void> {
    if (newBlocks.length !== oldBlocks.length) {
      throw new Error('new and old blocks must have the same length when updating blocks');
    }

    const updatePatches = [] as BlockPatch[];
    const undoPatches = [] as BlockPatch[];

    newBlocks.forEach((newBlock, i) => {
      const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlocks[i]);
      updatePatches.push(updatePatch);
      undoPatches.push(undoPatch);
    });

    return undoManager.perform(
      async () => {
        await this.patchBlocks(newBlocks, updatePatches, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlocks(newBlocks, undoPatches, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  // eslint-disable-next-line no-shadow
  async insertBlock(
    block: UIBlockWithDetails,
    description = 'add',
    afterRedo?: (block: UIBlockWithDetails) => Promise<void>,
    beforeUndo?: (block: UIBlockWithDetails) => Promise<void>
  ): Promise<UIBlockWithDetails> {
    return undoManager.perform(
      async () => {
        const jsonres = await this.insertBlockApi(block, publishIncrementalUpdate);
        const newBlock = jsonres[0] as UIBlockWithDetails;
        await afterRedo?.(newBlock);
        return newBlock;
      },
      async (newBlock: UIBlockWithDetails) => {
        await beforeUndo?.(newBlock);
        await this.deleteBlockApi(newBlock.id, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  // eslint-disable-next-line no-shadow
  async insertBlocks(
    blocks: UIBlockWithDetails[],
    description = 'add',
    afterRedo?: (blocks: UIBlockWithDetails[]) => Promise<void>,
    beforeUndo?: () => Promise<void>
  ) {
    return undoManager.perform(
      async () => {
        const newBlocks = await this.insertBlocksApi(blocks, publishIncrementalUpdate);
        await afterRedo?.(newBlocks);
        return newBlocks;
      },
      async (newBlocks: UIBlockWithDetails[]) => {
        await beforeUndo?.();
        const awaits = [];
        for (const block of newBlocks) {
          awaits.push(this.deleteBlockApi(block.id, publishIncrementalUpdate));
        }
        await Promise.all(awaits);
      },
      description,
      this.undoGroupId
    );
  }

  async deleteBlock(
    block: Pick<UIBlockWithDetails, 'type' | 'id'>,
    description?: string,
    beforeRedo?: () => Promise<void>,
    afterUndo?: () => Promise<void>
  ) {
    const actualDescription = description || `delete ${block.type}`;

    await undoManager.perform(
      async () => {
        await beforeRedo?.();
        await this.deleteBlockApi(block.id, publishIncrementalUpdate);
      },
      async () => {
        // await charmClient.insertBlock(block, publishIncrementalUpdate)
        await afterUndo?.();
      },
      actualDescription,
      this.undoGroupId
    );
  }

  async deleteBlocks(
    blockIds: string[],
    description = 'delete blocks',
    beforeRedo?: () => Promise<void>,
    afterUndo?: () => Promise<void>
  ) {
    await undoManager.perform(
      async () => {
        await beforeRedo?.();
        await this.deleteBlocksApi(blockIds, publishIncrementalUpdate);
      },
      async () => {
        // await charmClient.insertBlock(block, publishIncrementalUpdate)
        await afterUndo?.();
      },
      description,
      this.undoGroupId
    );
  }

  async changeTitle(blockId: string, oldTitle: string, newTitle: string, description = 'change title') {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { title: newTitle }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(blockId, { title: oldTitle }, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  async setDefaultTemplate(
    blockId: string,
    oldTemplateId: string,
    templateId: string,
    description = 'set default template'
  ) {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { updatedFields: { defaultTemplateId: templateId } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          blockId,
          { updatedFields: { defaultTemplateId: oldTemplateId } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async clearDefaultTemplate(blockId: string, oldTemplateId: string, description = 'set default template') {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { updatedFields: { defaultTemplateId: '' } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          blockId,
          { updatedFields: { defaultTemplateId: oldTemplateId } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async changeIcon(blockId: string, oldIcon: string | undefined, icon: string, description = 'change icon') {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { updatedFields: { icon } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(blockId, { updatedFields: { icon: oldIcon } }, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  async changeHeaderImage(
    blockId: string,
    oldHeaderImage: string | undefined | null,
    headerImage: string | null,
    description = 'change cover'
  ) {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { updatedFields: { headerImage } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(blockId, { updatedFields: { icon: oldHeaderImage } }, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  async changeDescription(
    blockId: string,
    oldBlockDescription: PageContent | undefined,
    blockDescription: PageContent,
    description = 'change description'
  ) {
    await undoManager.perform(
      async () => {
        await this.patchBlock(blockId, { updatedFields: { description: blockDescription } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          blockId,
          { updatedFields: { description: oldBlockDescription } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async showDescription(boardId: string, oldShowDescription: boolean, showDescription = true, description?: string) {
    let actionDescription = description;
    if (!actionDescription) {
      actionDescription = showDescription ? 'show description' : 'hide description';
    }

    await undoManager.perform(
      async () => {
        await this.patchBlock(boardId, { updatedFields: { showDescription } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          boardId,
          { updatedFields: { showDescription: oldShowDescription } },
          publishIncrementalUpdate
        );
      },
      actionDescription,
      this.undoGroupId
    );
  }

  async changeCardContentOrder(
    cardId: string,
    oldContentOrder: (string | string[])[],
    contentOrder: (string | string[])[],
    description = 'reorder'
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(cardId, { updatedFields: { contentOrder } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(cardId, { updatedFields: { contentOrder: oldContentOrder } }, publishIncrementalUpdate);
      },
      description,
      this.undoGroupId
    );
  }

  // Property Templates

  async insertPropertyTemplate(
    board: Board,
    activeView?: BoardView,
    index = -1,
    template?: IPropertyTemplate
  ): Promise<string> {
    const newTemplate = template || {
      id: Utils.createGuid(),
      name: 'New Property',
      type: 'text',
      options: []
    };

    const oldBlocks: UIBlockWithDetails[] = [board];

    const newBoard = createBoard({ block: board });

    // insert at end of board.fields.cardProperties
    newBoard.fields.cardProperties.push(newTemplate);
    const changedBlocks: UIBlockWithDetails[] = [newBoard];

    let description = 'add property';

    if (activeView?.fields.viewType === 'table') {
      oldBlocks.push(activeView);

      const newActiveView = createBoardView(activeView);
      let visiblePropertyIds = newActiveView.fields.visiblePropertyIds;
      const containsTitle = visiblePropertyIds.includes(Constants.titleColumnId);
      visiblePropertyIds = containsTitle ? visiblePropertyIds : [Constants.titleColumnId, ...visiblePropertyIds];
      // insert in proper location in activeview.fields.visiblePropetyIds
      const viewIndex = index > 0 ? index : visiblePropertyIds.length;
      visiblePropertyIds.splice(viewIndex, 0, newTemplate.id);
      changedBlocks.push(newActiveView);
      newActiveView.fields.visiblePropertyIds = visiblePropertyIds;
      description = 'add column';
    }

    await this.updateBlocks(changedBlocks, oldBlocks, description);
    return newTemplate.id;
  }

  async duplicatePropertyTemplate(board: Board, activeView: BoardView, propertyId: string) {
    if (!activeView) {
      Utils.assertFailure('duplicatePropertyTemplate: no activeView');
      return;
    }

    const oldBlocks: UIBlockWithDetails[] = [board];

    const newBoard = createBoard({ block: board });
    const changedBlocks: UIBlockWithDetails[] = [newBoard];
    const index = newBoard.fields.cardProperties.findIndex((o: IPropertyTemplate) => o.id === propertyId);
    if (index === -1) {
      Utils.assertFailure(`Cannot find template with id: ${propertyId}`);
      return;
    }
    const srcTemplate = newBoard.fields.cardProperties[index];
    const newTemplate: IPropertyTemplate = {
      id: Utils.createGuid(),
      name: `${srcTemplate.name} copy`,
      type: srcTemplate.type,
      options: srcTemplate.options.slice()
    };
    newBoard.fields.cardProperties.splice(index + 1, 0, newTemplate);

    let description = 'duplicate property';
    if (activeView.fields.viewType === 'table') {
      oldBlocks.push(activeView);

      const newActiveView = createBoardView(activeView);
      newActiveView.fields.visiblePropertyIds.push(newTemplate.id);
      changedBlocks.push(newActiveView);

      description = 'duplicate column';
    }

    await this.updateBlocks(changedBlocks, oldBlocks, description);
  }

  async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
    const templates = board.fields.cardProperties;
    const newValue = templates.slice();

    const srcIndex = templates.indexOf(template);
    Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`);
    newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0]);

    const newBoard = createBoard({ block: board });
    newBoard.fields.cardProperties = newValue;

    await this.updateBlock(newBoard, board, 'reorder properties');
  }

  async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {
    const oldBlocks: UIBlockWithDetails[] = [board];

    const newBoard = createBoard({ block: board });
    const changedBlocks: UIBlockWithDetails[] = [newBoard];
    newBoard.fields.cardProperties = board.fields.cardProperties.filter((o: IPropertyTemplate) => o.id !== propertyId);

    views.forEach((view) => {
      if (view.fields.visiblePropertyIds.includes(propertyId)) {
        oldBlocks.push(view);

        const newView = createBoardView(view);
        newView.fields.visiblePropertyIds = view.fields.visiblePropertyIds.filter((o: string) => o !== propertyId);
        changedBlocks.push(newView);
      }
    });
    cards.forEach((card) => {
      if (card.fields.properties[propertyId]) {
        oldBlocks.push(card);

        const newCard = createCard(card);
        delete newCard.fields.properties[propertyId];
        changedBlocks.push(newCard);
      }
    });

    await this.updateBlocks(changedBlocks, oldBlocks, 'delete property');
  }

  // Properties

  async insertPropertyOption(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    description = 'add option'
  ) {
    Utils.assert(board.fields.cardProperties.includes(template));

    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!;
    newTemplate.options.push(option);

    await this.updateBlock(newBoard, board, description);
  }

  async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!;
    newTemplate.options = newTemplate.options.filter((o) => o.id !== option.id);

    await this.updateBlock(newBoard, board, 'delete option');
  }

  async changePropertyOptionOrder(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    destIndex: number
  ) {
    const srcIndex = template.options.indexOf(option);
    Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`);

    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!;
    newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0]);

    await this.updateBlock(newBoard, board, 'reorder options');
  }

  async changePropertyOptionValue(
    board: Board,
    propertyTemplate: IPropertyTemplate,
    option: IPropertyOption,
    value: string
  ) {
    const oldBlocks: UIBlockWithDetails[] = [board];

    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id)!;
    const newOption = newTemplate.options.find((o) => o.id === option.id)!;
    newOption.value = value;
    const changedBlocks: UIBlockWithDetails[] = [newBoard];

    await this.updateBlocks(changedBlocks, oldBlocks, 'rename option');

    return changedBlocks;
  }

  async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {
    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!;
    const newOption = newTemplate.options.find((o) => o.id === option.id)!;
    newOption.color = color;
    await this.updateBlock(newBoard, board, 'change option color');
  }

  async changePropertyOption(board: Board, template: IPropertyTemplate, updatedOption: IPropertyOption) {
    const newBoard = createBoard({ block: board });
    const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!;
    const newOption = newTemplate.options.find((o) => o.id === updatedOption.id)!;
    newOption.color = updatedOption.color;
    newOption.value = updatedOption.value;
    await this.updateBlock(newBoard, board, 'change property option');
  }

  changePropertyValue(
    card: Card,
    propertyId: string,
    value?: string | string[] | number,
    description = 'change property',
    mutate = true
  ) {
    const oldValue = card.fields.properties[propertyId];

    // dont save anything if property value was not changed.
    if (oldValue === value) {
      return;
    }
    // handle undefined vs empty string
    if (!oldValue && !value) {
      return;
    }

    const newCard = createCard(card);
    if (value) {
      newCard.fields.properties[propertyId] = value;
    } else {
      delete newCard.fields.properties[propertyId];
    }
    if (mutate) {
      return this.updateBlock(newCard, card, description);
    } else {
      return { newBlock: newCard, block: card };
    }
  }

  changePropertyValues(
    cards: Card[],
    propertyId: string,
    value?: string | string[] | number,
    description = 'change property'
  ) {
    const oldBlocks: UIBlockWithDetails[] = [];
    const newBlocks: UIBlockWithDetails[] = [];

    cards
      .filter((card) => {
        const oldValue = card.fields.properties[propertyId];
        return oldValue !== value && (oldValue || value);
      })
      .forEach((card) => {
        const newCard = createCard(card);
        if (value) {
          newCard.fields.properties[propertyId] = value;
        } else {
          delete newCard.fields.properties[propertyId];
        }

        newBlocks.push(newCard);
        oldBlocks.push(card);
      });

    // dont save anything if property value was not changed.
    return this.updateBlocks(newBlocks, oldBlocks, description);
  }

  async updateProperty(board: Board, propertyId: string, updatedProperty: IPropertyTemplate) {
    const newBoard = createBoard({ block: board });
    const cardPropertyIndex = board.fields.cardProperties.findIndex((o: IPropertyTemplate) => o.id === propertyId);

    if (cardPropertyIndex === -1) {
      throw new Error(`Cannot find property with id: ${propertyId}`);
    }

    newBoard.fields.cardProperties[cardPropertyIndex] = updatedProperty;

    await this.updateBlock(newBoard, board, 'changed property');
  }

  async changePropertyTypeAndName(
    board: Board,
    cards: Card[],
    propertyTemplate: IPropertyTemplate,
    newType: PropertyType,
    newName: string,
    views: BoardView[],
    relationData?: RelationPropertyData
  ) {
    // console.log('changePropertyTypeAndName', board, propertyTemplate, newType, newName);
    const titleProperty: IPropertyTemplate = { id: Constants.titleColumnId, name: 'Title', type: 'text', options: [] };
    if (propertyTemplate.type === newType && propertyTemplate.name === newName) {
      return;
    }
    const newBoard = createBoard({ block: board });
    const cardProperty = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id);
    const newTemplate = propertyTemplate.id === Constants.titleColumnId ? cardProperty || titleProperty : cardProperty;
    if (!newTemplate) {
      return;
    }
    if (!cardProperty && propertyTemplate.id === Constants.titleColumnId) {
      newBoard.fields.cardProperties = [newTemplate, ...newBoard.fields.cardProperties];
    }

    if (propertyTemplate.type !== newType) {
      newTemplate.options = [];
    }

    newTemplate.type = newType;
    newTemplate.name = newName;

    if (newTemplate?.type === 'relation' && relationData) {
      newTemplate.relationData = relationData;
    }

    const oldBlocks: UIBlockWithDetails[] = [board];
    const newBlocks: UIBlockWithDetails[] = [newBoard];

    if (propertyTemplate.type !== newType) {
      if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') {
        // If the old type was either select or multiselect
        const isNewTypeSelectOrMulti = newType === 'select' || newType === 'multiSelect';

        for (const card of cards) {
          const oldValue = Array.isArray(card.fields.properties[propertyTemplate.id])
            ? (card.fields.properties[propertyTemplate.id] as string[]).length > 0 &&
              (card.fields.properties[propertyTemplate.id] as string[])[0]
            : card.fields.properties[propertyTemplate.id];
          if (oldValue) {
            const newValue = isNewTypeSelectOrMulti
              ? propertyTemplate.options.find((o) => o.id === oldValue)?.id
              : propertyTemplate.options.find((o) => o.id === oldValue)?.value;
            const newCard = createCard(card);

            if (newValue) {
              newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [newValue] : newValue;
            } else {
              // This was an invalid select option, so delete it
              delete newCard.fields.properties[propertyTemplate.id];
            }

            newBlocks.push(newCard);
            oldBlocks.push(card);
          }

          if (isNewTypeSelectOrMulti) {
            newTemplate.options = propertyTemplate.options;
          }
        }
      } else if (newType === 'select' || newType === 'multiSelect') {
        // if the new type is either select or multiselect
        // Map values to new template option IDs
        for (const card of cards) {
          const oldValue = card.fields.properties[propertyTemplate.id] as string;
          if (oldValue) {
            let option = newTemplate.options.find((o: IPropertyOption) => o.value === oldValue);
            if (!option) {
              option = {
                id: Utils.createGuid(),
                value: oldValue,
                color: 'propColorDefault'
              };
              newTemplate.options.push(option);
            }

            const newCard = createCard(card);
            newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [option.id] : option.id;

            newBlocks.push(newCard);
            oldBlocks.push(card);
          }
        }
      }
    }

    await this.updateBlocks(newBlocks, oldBlocks, 'change property type and name');
    for (const view of views) {
      const affectedFilters = view.fields.filter.filters.filter(
        (filter) => (filter as FilterClause).propertyId !== propertyTemplate.id
      );
      if (affectedFilters.length !== view.fields.filter.filters.length) {
        await this.changeViewFilter(view.id, view.fields.filter, {
          operation: 'and',
          filters: affectedFilters
        });
      }
    }
  }

  // Views

  async changeViewSortOptions(
    viewId: string,
    oldSortOptions: ISortOption[],
    sortOptions: ISortOption[]
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { sortOptions } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(viewId, { updatedFields: { sortOptions: oldSortOptions } }, publishIncrementalUpdate);
      },
      'sort',
      this.undoGroupId
    );
  }

  async changeViewFilter(viewId: string, oldFilter: FilterGroup, filter: FilterGroup): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { filter } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(viewId, { updatedFields: { filter: oldFilter } }, publishIncrementalUpdate);
      },
      'filter',
      this.undoGroupId
    );
  }

  async changeViewGroupById(viewId: string, oldGroupById: string | undefined, groupById: string): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { groupById } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(viewId, { updatedFields: { groupById: oldGroupById } }, publishIncrementalUpdate);
      },
      'group by',
      this.undoGroupId
    );
  }

  async changeViewDateDisplayPropertyId(
    viewId: string,
    oldDateDisplayPropertyId: string | undefined,
    dateDisplayPropertyId: string
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { dateDisplayPropertyId } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { dateDisplayPropertyId: oldDateDisplayPropertyId } },
          publishIncrementalUpdate
        );
      },
      'display by',
      this.undoDisplayId
    );
  }

  async changeBoardViewsOrder(
    boardId: string,
    currentViewIds: string[],
    droppedView: BoardView,
    dropzoneView: BoardView
  ) {
    const tempViewIds = [...currentViewIds];
    const droppedViewIndex = tempViewIds.indexOf(droppedView.id);
    const dropzoneViewIndex = tempViewIds.indexOf(dropzoneView.id);
    tempViewIds.splice(dropzoneViewIndex, 0, tempViewIds.splice(droppedViewIndex, 1)[0]);
    await undoManager.perform(
      async () => {
        await this.patchBlock(boardId, { updatedFields: { viewIds: tempViewIds } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          boardId,
          { updatedFields: { visiblePropertyIds: currentViewIds } },
          publishIncrementalUpdate
        );
      },
      "change board's views order"
    );
  }

  async changeViewVisiblePropertiesOrder(
    viewId: string,
    visiblePropertyIds: string[],
    template: IPropertyTemplate,
    destIndex: number,
    description = 'change property order'
  ): Promise<void> {
    const oldVisiblePropertyIds = visiblePropertyIds;
    const newOrder = oldVisiblePropertyIds.slice();

    const srcIndex = oldVisiblePropertyIds.indexOf(template.id);
    Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`);

    newOrder.splice(destIndex, 0, newOrder.splice(srcIndex, 1)[0]);

    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { visiblePropertyIds: newOrder } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { visiblePropertyIds: oldVisiblePropertyIds } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async changeViewVisibleProperties(
    viewId: string,
    oldVisiblePropertyIds: string[],
    visiblePropertyIds: string[],
    description = 'show / hide property'
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { visiblePropertyIds } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { visiblePropertyIds: oldVisiblePropertyIds } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async changeViewVisibleOptionIds(
    viewId: string,
    oldVisibleOptionIds: string[],
    visibleOptionIds: string[],
    description = 'reorder'
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { visibleOptionIds } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { visibleOptionIds: oldVisibleOptionIds } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async changeViewHiddenOptionIds(
    viewId: string,
    oldHiddenOptionIds: string[],
    hiddenOptionIds: string[],
    description = 'reorder'
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(viewId, { updatedFields: { hiddenOptionIds } }, publishIncrementalUpdate);
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { hiddenOptionIds: oldHiddenOptionIds } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async changeViewKanbanCalculations(
    viewId: string,
    oldCalculations: Record<string, KanbanCalculationFields>,
    calculations: Record<string, KanbanCalculationFields>,
    description = 'updated kanban calculations'
  ): Promise<void> {
    await undoManager.perform(
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { kanbanCalculations: calculations } },
          publishIncrementalUpdate
        );
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { kanbanCalculations: oldCalculations } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async toggleColumnWrap(
    viewId: string,
    templateId: string,
    currentColumnWrappedIds: string[],
    description = 'toggle column wrap'
  ): Promise<void> {
    const currentColumnWrap = currentColumnWrappedIds.includes(templateId);
    await undoManager.perform(
      async () => {
        await this.patchBlock(
          viewId,
          {
            updatedFields: {
              columnWrappedIds: currentColumnWrap
                ? currentColumnWrappedIds.filter((currentColumnWrappedId) => currentColumnWrappedId !== templateId)
                : [...currentColumnWrappedIds, templateId]
            }
          },
          publishIncrementalUpdate
        );
      },
      async () => {
        await this.patchBlock(
          viewId,
          { updatedFields: { columnWrappedIds: currentColumnWrappedIds } },
          publishIncrementalUpdate
        );
      },
      description,
      this.undoGroupId
    );
  }

  async hideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
    if (view.fields.hiddenOptionIds.includes(columnOptionId)) {
      return;
    }

    const newView = createBoardView(view);
    newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId);
    newView.fields.hiddenOptionIds = [...newView.fields.hiddenOptionIds, columnOptionId];
    await this.updateBlock(newView, view, 'hide column');
  }

  async unhideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
    if (!view.fields.hiddenOptionIds.includes(columnOptionId)) {
      return;
    }

    const newView = createBoardView(view);
    newView.fields.hiddenOptionIds = newView.fields.hiddenOptionIds.filter((o) => o !== columnOptionId);

    // Put the column at the end of the visible list
    newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId);
    newView.fields.visibleOptionIds = [...newView.fields.visibleOptionIds, columnOptionId];
    await this.updateBlock(newView, view, 'show column');
  }

  changeViewCardOrder(view: BoardView, cardOrder: string[], description = 'reorder', mutate = true) {
    const newView = createBoardView(view);
    newView.fields.cardOrder = cardOrder;
    if (mutate) {
      return this.updateBlock(newView, view, description);
    } else {
      return { newBlock: newView, block: view };
    }
  }

  // Duplicate

  async duplicateCard({
    card,
    board,
    description = 'duplicate card',
    asTemplate = false,
    afterRedo,
    beforeUndo
  }: {
    card: Card;
    board: Board;
    description?: string;
    asTemplate?: boolean;
    afterRedo?: (newCardId: string) => Promise<void>;
    beforeUndo?: () => Promise<void>;
  }): Promise<[UIBlockWithDetails[], string]> {
    const blocks = await charmClient.getSubtree({ pageId: card.pageId! });
    const pageDetails = card.pageId ? await charmClient.getPage(card.pageId) : null;
    const [newBlocks, newCard] = OctoUtils.duplicateBlockTree(blocks, card.id) as [
      UIBlockWithDetails[],
      Card,
      Record<string, string>
    ];

    Utils.log(`duplicateCard: duplicating ${newBlocks.length} blocks`);
    if (asTemplate === newCard.fields.isTemplate) {
      // Copy template
      newCard.title = `${card.title} copy`;
    } else if (asTemplate) {
      // Template from card
      newCard.title = 'New card template';
    } else {
      // Card from template
      newCard.title = '';
    }
    newCard.fields.isTemplate = asTemplate;
    newCard.rootId = board.id;
    newCard.parentId = board.id;
    newCard.fields.icon = card.icon || undefined;
    newCard.fields.headerImage = pageDetails?.headerImage || undefined;
    newCard.fields.content = pageDetails?.content;
    newCard.fields.contentText = pageDetails?.contentText;

    await this.insertBlocks(
      newBlocks,
      description,
      async (respBlocks: UIBlockWithDetails[]) => {
        const _card = respBlocks.find((block) => block.type === 'card');
        if (_card) {
          await afterRedo?.(_card.id);
        } else {
          Utils.logError('card not found for opening.');
        }
      },
      beforeUndo
    );
    return [newBlocks, newCard.id];
  }

  // Other methods

  async reorderProperties(boardId: string, cardProperties: IPropertyTemplate[]) {
    await this.patchBlock(
      boardId,
      {
        updatedFields: {
          cardProperties
        }
      },
      () => {}
    );
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

const mutator = new Mutator();
export default mutator;

export { mutator };
