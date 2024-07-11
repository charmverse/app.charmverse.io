import {
  PROJECT_MEMBER_EMAILS_ID,
  PROJECT_MEMBER_NAMES_ID,
  PROJECT_NAME_ID,
  PROJECT_TWITTER_ID
} from '@root/lib/projects/formField';
import { v4 } from 'uuid';

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
    const customProperty1Id = v4();
    const customProperty3Id = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: customProperty1Id,
          type: 'text',
          name: 'Custom property 1',
          options: []
        },
        // Custom proposal source board properties
        {
          id: v4(),
          type: 'text',
          name: 'Custom property 2',
          options: []
        },
        {
          id: customProperty3Id,
          type: 'text',
          name: 'Custom property 3',
          options: []
        }
      ],
      proposalCustomProperties: [
        {
          id: customProperty1Id,
          type: 'text',
          name: 'Custom property 1',
          options: []
        },
        {
          id: customProperty3Id,
          type: 'text',
          name: 'Custom property 3',
          options: []
        }
      ],
      selectedProperties: {
        customProperties: [customProperty1Id],
        defaults: [],
        formFields: [],
        project: [],
        projectMember: [],
        rubricEvaluations: []
      }
    });

    expect(properties.length).toBe(2);
    const customProperty1 = properties.find((p) => p.id === customProperty1Id);
    const customProperty2 = properties.find((p) => p.name === 'Custom property 2');
    expect(customProperty1).toBeTruthy();
    expect(customProperty2).toBeTruthy();
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
          type: 'proposalStep',
          name: 'Proposal step',
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
          options: [],
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalEvaluationTotal',
          name: 'Rubric 1',
          options: [],
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
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
            average: true,
            total: false
          }
        ]
      }
    });

    expect(properties.length).toBe(1);
    expect(properties[0].type).toBe('proposalEvaluationAverage');
  });

  it('Should filter out rubric evaluations criteria reviewer properties that are not selected', () => {
    const user1Id = v4();
    const user2Id = v4();

    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Rubric 1 - Criteria 1 - User 1 - Comment',
          options: [],
          criteriaTitle: 'Criteria 1',
          reviewerId: user1Id,
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Rubric 1 - Criteria 1 - User 1 - Score',
          options: [],
          criteriaTitle: 'Criteria 1',
          reviewerId: user1Id,
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Rubric 1 - Criteria 1 - User 2 - Score',
          options: [],
          criteriaTitle: 'Criteria 1',
          reviewerId: user2Id,
          evaluationTitle: 'Rubric 1'
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Rubric 2 - Criteria 1 - User 1 - Comment',
          options: [],
          criteriaTitle: 'Criteria 2',
          reviewerId: user1Id,
          evaluationTitle: 'Rubric 2'
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Rubric 2 - Criteria 1 - User 1 - Score',
          options: [],
          criteriaTitle: 'Criteria 2',
          reviewerId: user1Id,
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
            reviewerComment: true,
            reviewerScore: true
          },
          {
            title: 'Rubric 2',
            reviewerComment: true,
            reviewerScore: false
          }
        ]
      }
    });

    const rubricCriteria1Reviewer1Comment = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.reviewerId === user1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment' &&
        p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria1Reviewer1Score = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.reviewerId === user1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore' &&
        p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria1Reviewer2Comment = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.reviewerId === user2Id &&
        p.type === 'proposalRubricCriteriaReviewerComment' &&
        p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria1Reviewer2Score = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.reviewerId === user2Id &&
        p.type === 'proposalRubricCriteriaReviewerScore' &&
        p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria2Reviewer1Comment = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.reviewerId === user1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment' &&
        p.criteriaTitle === 'Criteria 2'
    );
    const rubricCriteria2Reviewer1Score = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.reviewerId === user1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore' &&
        p.criteriaTitle === 'Criteria 2'
    );
    const rubricCriteria2Reviewer2Comment = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.reviewerId === user2Id &&
        p.type === 'proposalRubricCriteriaReviewerComment' &&
        p.criteriaTitle === 'Criteria 2'
    );
    const rubricCriteria2Reviewer2Score = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.reviewerId === user2Id &&
        p.type === 'proposalRubricCriteriaReviewerScore' &&
        p.criteriaTitle === 'Criteria 2'
    );

    expect(rubricCriteria1Reviewer1Comment).toBeTruthy();
    expect(rubricCriteria1Reviewer1Score).toBeTruthy();
    expect(rubricCriteria1Reviewer2Comment).toBeFalsy();
    expect(rubricCriteria1Reviewer2Score).toBeTruthy();

    expect(rubricCriteria2Reviewer1Comment).toBeTruthy();
    expect(rubricCriteria2Reviewer1Score).toBeFalsy();
    expect(rubricCriteria2Reviewer2Comment).toBeFalsy();
    expect(rubricCriteria2Reviewer2Score).toBeFalsy();
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
          type: 'proposalRubricCriteriaAverage',
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
            criteriaTotal: true,
            criteriaAverage: true
          }
        ]
      }
    });

    const rubric1CriteriaTotalProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaTotal' && p.evaluationTitle === 'Rubric 1'
    );
    const rubric1CriteriaAverageProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaAverage' && p.evaluationTitle === 'Rubric 1'
    );
    expect(properties.length).toBe(2);
    expect(rubric1CriteriaTotalProperty).toBeTruthy();
    expect(rubric1CriteriaAverageProperty).toBeTruthy();
  });
});
