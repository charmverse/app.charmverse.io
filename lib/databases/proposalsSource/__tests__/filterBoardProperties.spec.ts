import { v4 } from 'uuid';

import {
  PROJECT_MEMBER_EMAILS_ID,
  PROJECT_MEMBER_NAMES_ID,
  PROJECT_NAME_ID,
  PROJECT_TWITTER_ID
} from 'lib/projects/formField';

import { filterBoardProperties } from '../filterBoardProperties';

describe('filterBoardProperties', () => {
  it('Should filter out form fields that are not selected', () => {
    const formFieldId = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'text',
          name: 'Form field 1',
          options: [],
          formFieldId
        },
        {
          id: v4(),
          type: 'text',
          name: 'Form field 2',
          options: [],
          formFieldId: v4()
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        formFields: [formFieldId],
        project: [],
        projectMember: [],
        rubricEvaluations: []
      }
    });

    expect(properties.length).toBe(1);
    expect(properties[0].name).toBe('Form field 1');
  });

  it('Should filter out project properties that are not selected', () => {
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: PROJECT_NAME_ID,
          type: 'text',
          name: 'Project name',
          options: []
        },
        {
          id: PROJECT_TWITTER_ID,
          type: 'text',
          name: 'Project twitter',
          options: []
        },
        {
          id: PROJECT_MEMBER_NAMES_ID,
          type: 'text',
          name: 'Project member names',
          options: []
        },
        {
          id: PROJECT_MEMBER_EMAILS_ID,
          type: 'text',
          name: 'Project member emails',
          options: []
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        formFields: [],
        project: ['name'],
        projectMember: ['name'],
        rubricEvaluations: []
      }
    });

    expect(properties.length).toBe(2);
    expect(properties.find((p) => p.id === PROJECT_NAME_ID)).toBeTruthy();
    expect(properties.find((p) => p.id === PROJECT_MEMBER_NAMES_ID)).toBeTruthy();
  });

  it('Should filter out custom properties that are not selected', () => {
    const customPropertyId = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: customPropertyId,
          type: 'text',
          name: 'Custom property 1',
          options: []
        },
        {
          id: v4(),
          type: 'text',
          name: 'Custom property 2',
          options: []
        }
      ],
      proposalCustomProperties: [
        {
          id: customPropertyId,
          type: 'text',
          name: 'Custom property 1',
          options: []
        }
      ],
      selectedProperties: {
        customProperties: [customPropertyId],
        defaults: [],
        formFields: [],
        project: [],
        projectMember: [],
        rubricEvaluations: []
      }
    });

    expect(properties.length).toBe(1);
    expect(properties[0].name).toBe('Custom property 1');
  });

  it('Should filter out default properties that are not selected', () => {
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalReviewerNotes',
          name: 'Proposal reviewer notes',
          options: []
        },
        {
          id: v4(),
          type: 'text',
          name: 'Default property 2',
          options: []
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: ['proposalReviewerNotes'],
        formFields: [],
        project: [],
        projectMember: [],
        rubricEvaluations: []
      }
    });

    expect(properties.length).toBe(1);
  });

  it('Should filter out rubric evaluations that are not selected', () => {
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
          name: 'Rubric 1',
          options: []
        },
        {
          id: v4(),
          type: 'proposalEvaluationTotal',
          name: 'Rubric 1',
          options: []
        },
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
          name: 'Rubric 2',
          options: []
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        formFields: [],
        project: [],
        projectMember: [],
        rubricEvaluations: [
          {
            title: 'Rubric 1',
            average: true,
            total: false
          }
        ]
      }
    });

    expect(properties.length).toBe(1);
    expect(properties[0].type).toBe('proposalEvaluationAverage');
  });

  it(`Should filter out rubric criterial total properties that are not selected`, () => {
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Rubric 1',
          options: [],
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Rubric 2',
          options: [],
          evaluationTitle: 'Rubric 2'
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        formFields: [],
        project: [],
        projectMember: [],
        rubricEvaluations: [
          {
            title: 'Rubric 1',
            criteriaTotal: true
          }
        ]
      }
    });

    expect(properties.length).toBe(1);
    expect(properties[0].type).toBe('proposalRubricCriteriaTotal');
  });
});
