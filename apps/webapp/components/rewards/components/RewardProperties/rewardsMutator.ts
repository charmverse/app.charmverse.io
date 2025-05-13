/* eslint-disable default-param-last */
import { Mutator } from 'components/common/DatabaseEditor/mutator';
import { Utils } from 'components/common/DatabaseEditor/utils';
import type { RewardBlocksContextType } from 'components/rewards/hooks/useRewardBlocks';
import type { UIBlockWithDetails } from '@packages/databases/block';
import type {
  Board,
  IPropertyOption,
  IPropertyTemplate,
  PropertyType,
  RelationPropertyData
} from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import type { RewardPropertiesField } from '@packages/lib/rewards/blocks/interfaces';

export interface BlockChange {
  block: UIBlockWithDetails;
  newBlock: UIBlockWithDetails;
}

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
export class RewardsMutator extends Mutator {
  // callback invoked on property value change
  private onPropertiesChange?: (val: any) => void;

  public blocksContext: RewardBlocksContextType;

  // other methods related to reward blocks
  constructor(
    blocksContext: RewardBlocksContextType,
    onPropertiesChange?: (properties: RewardPropertiesField) => void
  ) {
    super();

    this.blocksContext = blocksContext;
    this.onPropertiesChange = onPropertiesChange;
  }

  // Property Templates
  async insertPropertyTemplate(
    board: Board,
    activeView: BoardView,
    index = -1,
    template?: IPropertyTemplate
  ): Promise<string> {
    const newTemplate = template || {
      id: Utils.createGuid(),
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
    views: BoardView[],
    relationData?: RelationPropertyData
  ) {
    this.blocksContext.updateProperty({
      ...propertyTemplate,
      type: newType,
      name: newName,
      relationData: newType === 'relation' ? relationData : propertyTemplate.relationData
    });
  }

  // to enable undeleting properties
  async updateProperty(board: Board, propertyId: string, updatedProperty: IPropertyTemplate) {
    this.blocksContext.updateProperty({
      ...updatedProperty
    });
  }

  async reorderProperties(boardId: string, cardProperties: IPropertyTemplate[]): Promise<void> {
    const rewardsBoardBlock = this.blocksContext.rewardsBoardBlock;
    const oldFields = rewardsBoardBlock?.fields || {};

    if (!rewardsBoardBlock) {
      return;
    }

    await this.blocksContext.updateBlock({
      ...rewardsBoardBlock,
      fields: { ...oldFields, cardProperties }
    });
  }

  async changePropertyValue(
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

    // reward fields are saved in Reward entity so we don't need to update the block
    // that is why we use external onChange callback
    const properties = { ...card.fields.properties } || {};

    if (value) {
      properties[propertyId] = value;
    } else {
      delete properties[propertyId];
    }

    this.onPropertiesChange?.(properties);
  }

  async changePropertyOption(board: Board, template: IPropertyTemplate, updatedOption: IPropertyOption) {
    const rewardsBoardBlock = this.blocksContext.rewardsBoardBlock;

    const updatedProperties = rewardsBoardBlock?.fields?.cardProperties
      ? [...rewardsBoardBlock.fields.cardProperties]
      : [];

    if (!rewardsBoardBlock) {
      return;
    }

    const properties = updatedProperties.map((p) => {
      if (p.id !== template.id) {
        return p;
      }

      return {
        ...p,
        options: p.options.map((o) =>
          o.id === updatedOption.id ? { ...o, color: updatedOption.color, value: updatedOption.value } : o
        )
      };
    });

    const oldFields = rewardsBoardBlock?.fields || {};

    await this.blocksContext.updateBlock({
      ...rewardsBoardBlock,
      fields: { ...oldFields, cardProperties: properties }
    });
  }

  async insertPropertyOption(
    board: Board,
    template: IPropertyTemplate,
    option: IPropertyOption,
    description = 'add option'
  ) {
    const rewardsBoardBlock = this.blocksContext.rewardsBoardBlock;

    const updatedProperties = rewardsBoardBlock?.fields?.cardProperties
      ? [...rewardsBoardBlock.fields.cardProperties]
      : [];

    if (!rewardsBoardBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options ? [...udpatedTemplate.options, option] : [option];

      const oldFields = rewardsBoardBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...rewardsBoardBlock,
        fields: { ...oldFields, cardProperties: updatedProperties }
      });
    }
  }

  async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
    const rewardsBoardBlock = this.blocksContext.rewardsBoardBlock;

    const updatedProperties = rewardsBoardBlock?.fields?.cardProperties
      ? [...rewardsBoardBlock.fields.cardProperties]
      : [];

    if (!rewardsBoardBlock) {
      return;
    }

    const udpatedTemplate = updatedProperties.find((o) => o.id === template.id);

    if (udpatedTemplate) {
      udpatedTemplate.options = udpatedTemplate.options?.filter((o) => o.id !== option.id) || [];

      const oldFields = rewardsBoardBlock?.fields || {};

      await this.blocksContext.updateBlock({
        ...rewardsBoardBlock,
        fields: { ...oldFields, cardProperties: updatedProperties }
      });
    }
  }
}
