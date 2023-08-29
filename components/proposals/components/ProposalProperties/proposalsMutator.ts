/* eslint-disable default-param-last */
import type { PageMeta } from '@charmverse/core/pages';

import { Mutator } from 'components/common/BoardEditor/focalboard/src/mutator';
import octoClient from 'components/common/BoardEditor/focalboard/src/octoClient';
import undoManager from 'components/common/BoardEditor/focalboard/src/undomanager';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { ProposalBlocksContextType } from 'hooks/useProposalBlocks';
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
export class ProposalsMutator extends Mutator {
  // callback invoked on property value change
  private onValueChange?: (val: any) => void;

  public blocksContext: ProposalBlocksContextType;

  // other methods related to proposal blocks
  constructor(blocksContext: ProposalBlocksContextType, onValueChange?: (val: any) => void) {
    super();

    this.blocksContext = blocksContext;
    this.onValueChange = onValueChange;
  }

  // Property Templates
  async insertPropertyTemplate(
    board: Board,
    activeView: BoardView,
    index = -1,
    template?: IPropertyTemplate
  ): Promise<string> {
    const newTemplate = template || {
      id: Utils.createGuid(IDType.BlockID),
      name: 'New Property',
      type: 'text',
      options: []
    };

    await this.blocksContext.createProperty(newTemplate);

    return newTemplate.id;
  }

  async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {
    await this.blocksContext.deleteProperty(propertyId);
  }

  async changePropertyTypeAndName(
    board: Board,
    cards: Card[],
    propertyTemplate: IPropertyTemplate,
    newType: PropertyType,
    newName: string,
    views: BoardView[]
  ) {
    this.blocksContext.updateProperty({ ...propertyTemplate, type: newType, name: newName });
  }
}
