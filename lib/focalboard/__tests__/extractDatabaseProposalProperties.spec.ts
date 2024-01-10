import { ProposalStatus } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import { extractDatabaseProposalProperties } from '../extractDatabaseProposalProperties';
import type { ExtractedDatabaseProposalProperties } from '../extractDatabaseProposalProperties';

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

describe('extractDatabaseProposalProperties', () => {
  it('should extract database proposal properties', () => {
    const exampleProperties: IPropertyTemplate[] = [
      statusProp,
      urlProp,
      evaluatedByProp,
      evaluatedTotalProp,
      evaluatedAverageProp
    ];

    const extractedProps = extractDatabaseProposalProperties({
      boardBlock: {
        fields: {
          cardProperties: exampleProperties
        } as any
      }
    });

    expect(extractedProps).toMatchObject<ExtractedDatabaseProposalProperties>({
      proposalStatus: statusProp,
      proposalUrl: urlProp,
      proposalEvaluatedBy: evaluatedByProp,
      proposalEvaluationAverage: evaluatedAverageProp,
      proposalEvaluationTotal: evaluatedTotalProp
    });
  });

  it('should work if only some properties are present', () => {
    const exampleProperties: IPropertyTemplate[] = [];

    const extractedProps = extractDatabaseProposalProperties({
      boardBlock: {
        fields: {
          cardProperties: exampleProperties
        } as any
      }
    });

    expect(extractedProps).toMatchObject<Partial<ExtractedDatabaseProposalProperties>>({});
  });
});
