import { ProposalStatus } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import type { ExtractedCardProposalProperties } from '../extractCardProposalProperties';
import { extractCardProposalProperties } from '../extractCardProposalProperties';
import { extractDatabaseProposalProperties } from '../extractDatabaseProposalProperties';

const statusProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Status',
  type: 'proposalStatus',
  options: [
    ...objectUtils.typedKeys(ProposalStatus).map((key) => ({
      id: uuid(),
      color: 'propColorTeal',
      value: key
    })),
    {
      id: uuid(),
      color: 'propColorTeal',
      value: 'archived'
    }
  ]
};

const urlProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal URL',
  type: 'proposalUrl',
  options: []
};

const evaluatedByProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Evaluated By',
  options: [],
  type: 'proposalEvaluatedBy'
};

const evaluatedTotalProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Evaluation Total',
  options: [],
  type: 'proposalEvaluationTotal'
};

const evaluatedAverageProp: IPropertyTemplate = {
  id: uuid(),
  name: 'Proposal Evaluation Average',
  options: [],
  type: 'proposalEvaluationAverage'
};

describe('extractCardProposalProperties', () => {
  it('should extract card proposal properties', () => {
    const exampleProperties: IPropertyTemplate[] = [
      statusProp,
      urlProp,
      evaluatedAverageProp,
      evaluatedTotalProp,
      evaluatedByProp
    ];

    const extractedSchema = extractDatabaseProposalProperties({
      boardBlock: { fields: { cardProperties: exampleProperties } as any }
    });

    const extractedValues = extractCardProposalProperties({
      card: {
        fields: {
          properties: {
            [statusProp.id]: statusProp.options[0].id,
            [urlProp.id]: 'https://example.com'
          }
        } as any
      },
      databaseProperties: extractedSchema
    });

    expect(extractedValues).toMatchObject<Partial<ExtractedCardProposalProperties>>({
      cardProposalStatus: {
        propertyId: statusProp.id,
        optionId: statusProp.options[0].id,
        value: statusProp.options[0].value as any
      },
      cardProposalUrl: {
        propertyId: urlProp.id,
        value: 'https://example.com'
      }
    });
  });

  it('should work if only some properties are present', () => {
    const exampleProperties: IPropertyTemplate[] = [];

    const extractedSchema = extractDatabaseProposalProperties({
      boardBlock: { fields: { cardProperties: exampleProperties } as any }
    });

    const extractedValues = extractCardProposalProperties({
      card: {
        fields: {
          properties: {
            [statusProp.id]: statusProp.options[0].id,
            [urlProp.id]: 'https://example.com'
          }
        } as any
      },
      databaseProperties: extractedSchema
    });

    expect(extractedValues).toMatchObject<Partial<ExtractedCardProposalProperties>>({});
  });
});
