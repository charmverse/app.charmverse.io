import {
  PROJECT_DESCRIPTION_ID,
  PROJECT_MEMBER_NAMES_ID,
  PROJECT_MEMBER_WALLETS_ID,
  PROJECT_NAME_ID
} from '@packages/lib/projects/formField';
import { v4 } from 'uuid';

import { createSelectedPropertiesStateFromBoardProperties } from '../createSelectedPropertiesFromBoardProperties';
import type { SelectedProposalProperties } from '../interfaces';

describe(`createSelectedPropertiesStateFromBoardProperties`, () => {
  it(`Should return recreated selected properties state from board properties`, async () => {
    const proposalCustomProperty1Id = v4();
    const proposalCustomProperty2Id = v4();
    const template1Id = v4();
    const template2Id = v4();
    const formField1Id = v4();
    const formField2Id = v4();
    const formField3Id = v4();
    const template1Evaluation1Id = v4();
    const template1Evaluation2Id = v4();
    const template2Evaluation1Id = v4();

    const selectedPropertiesState = createSelectedPropertiesStateFromBoardProperties({
      cardProperties: [
        {
          id: proposalCustomProperty1Id,
          type: 'checkbox',
          options: [],
          name: 'Custom Property 1'
        },
        {
          id: proposalCustomProperty2Id,
          type: 'text',
          options: [],
          name: 'Custom Property 2'
        },
        {
          id: PROJECT_NAME_ID,
          type: 'text',
          name: 'Project name',
          options: []
        },
        {
          id: PROJECT_DESCRIPTION_ID,
          type: 'text',
          name: 'Project excerpt',
          options: []
        },
        {
          id: PROJECT_MEMBER_NAMES_ID,
          type: 'multiSelect',
          name: 'Project Members',
          options: []
        },
        {
          id: PROJECT_MEMBER_WALLETS_ID,
          type: 'text',
          name: 'Project Wallets',
          options: []
        },
        {
          id: v4(),
          type: 'proposalReviewerNotes',
          name: 'Reviewer Notes',
          options: []
        },
        {
          id: v4(),
          type: 'proposalStatus',
          name: 'Proposal status',
          options: []
        },
        {
          id: v4(),
          name: 'Short text',
          options: [],
          type: 'text',
          formFieldId: formField1Id,
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Long text',
          options: [],
          type: 'text',
          formFieldId: formField2Id,
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Wallet address',
          options: [],
          type: 'text',
          formFieldId: formField3Id,
          templateId: template2Id
        },
        {
          id: v4(),
          name: 'Evaluated by',
          options: [],
          type: 'proposalEvaluatedBy',
          evaluationTitle: 'Evaluation 1',
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Evaluation total',
          options: [],
          type: 'proposalEvaluationTotal',
          evaluationTitle: 'Evaluation 1',
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Evaluation average',
          options: [],
          type: 'proposalEvaluationAverage',
          evaluationTitle: 'Evaluation 1',
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Criteria total',
          options: [],
          type: 'proposalRubricCriteriaTotal',
          evaluationTitle: 'Evaluation 2',
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Criteria average',
          options: [],
          type: 'proposalRubricCriteriaAverage',
          evaluationTitle: 'Evaluation 2',
          templateId: template1Id
        },
        {
          id: v4(),
          name: 'Reviewer score',
          options: [],
          type: 'proposalRubricCriteriaReviewerScore',
          evaluationTitle: 'Evaluation 1',
          templateId: template2Id
        },
        {
          id: v4(),
          name: 'Reviewer comment',
          options: [],
          type: 'proposalRubricCriteriaReviewerComment',
          evaluationTitle: 'Evaluation 1',
          templateId: template2Id
        }
      ],
      proposalCustomProperties: [
        {
          id: proposalCustomProperty1Id,
          name: 'Custom Property 1',
          options: [],
          type: 'checkbox'
        },
        {
          id: proposalCustomProperty2Id,
          name: 'Custom Property 2',
          options: [],
          type: 'text'
        }
      ],
      proposalTemplates: [
        {
          pageId: template1Id,
          evaluations: [
            {
              id: template1Evaluation1Id,
              title: 'Evaluation 1',
              type: 'rubric'
            },
            {
              id: template1Evaluation2Id,
              title: 'Evaluation 2',
              type: 'rubric'
            }
          ]
        },
        {
          pageId: template2Id,
          evaluations: [
            {
              id: template2Evaluation1Id,
              title: 'Evaluation 1',
              type: 'rubric'
            }
          ]
        }
      ]
    });

    expect(selectedPropertiesState).toMatchObject<SelectedProposalProperties>({
      customProperties: [proposalCustomProperty1Id, proposalCustomProperty2Id],
      defaults: ['proposalReviewerNotes', 'proposalStatus'],
      project: ['name', 'description'],
      projectMember: ['name', 'walletAddress'],
      templateProperties: [
        {
          formFields: [formField1Id, formField2Id],
          templateId: template1Id,
          rubricEvaluations: [
            {
              evaluationId: template1Evaluation1Id,
              properties: ['reviewers', 'total', 'average'],
              title: 'Evaluation 1'
            },
            {
              evaluationId: template1Evaluation2Id,
              properties: ['criteriaTotal', 'criteriaAverage'],
              title: 'Evaluation 2'
            }
          ]
        },
        {
          formFields: [formField3Id],
          templateId: template2Id,
          rubricEvaluations: [
            {
              evaluationId: template2Evaluation1Id,
              properties: ['reviewerScore', 'reviewerComment'],
              title: 'Evaluation 1'
            }
          ]
        }
      ]
    });
  });
});
