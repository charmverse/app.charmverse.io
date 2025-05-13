import {
  PROJECT_MEMBER_EMAILS_ID,
  PROJECT_MEMBER_NAMES_ID,
  PROJECT_NAME_ID,
  PROJECT_TWITTER_ID
} from '@packages/lib/projects/formField';
import { v4 } from 'uuid';

import { filterBoardProperties } from '../filterBoardProperties';

describe('filterBoardProperties', () => {
  it('Should filter out form fields that are not selected', () => {
    const formFieldId = v4();
    const templateId = v4();
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
      evaluationSteps: [
        {
          rubricCriteria: [],
          proposal: {
            page: {
              id: templateId,
              title: 'Template 1',
              type: 'proposal_template',
              sourceTemplateId: null
            }
          },
          title: 'Step 1',
          type: 'rubric'
        },
        {
          rubricCriteria: [],
          proposal: {
            page: {
              id: v4(),
              title: 'Template 2',
              type: 'proposal_template',
              sourceTemplateId: null
            }
          },
          title: 'Step 1',
          type: 'rubric'
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        project: [],
        projectMember: [],
        templateProperties: [
          {
            formFields: [formFieldId],
            rubricEvaluations: [],
            templateId
          }
        ]
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
        project: ['name'],
        projectMember: ['name'],
        templateProperties: []
      },
      evaluationSteps: []
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
        project: [],
        projectMember: [],
        templateProperties: []
      },
      evaluationSteps: []
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
        project: [],
        projectMember: [],
        templateProperties: []
      },
      evaluationSteps: []
    });

    expect(properties.length).toBe(1);
  });

  it('Should filter out rubric evaluations that are not selected', () => {
    const template1Id = v4();
    const template2Id = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
          name: 'Template 1 - Rubric 1 - Average',
          options: [],
          evaluationTitle: 'Rubric 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalEvaluationTotal',
          name: 'Template 1 - Rubric 1 - Total',
          options: [],
          evaluationTitle: 'Rubric 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
          name: 'Template 1 - Rubric 2 - Average',
          options: [],
          evaluationTitle: 'Rubric 2',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalEvaluationTotal',
          name: 'Template 1 - Rubric 2 - Total',
          options: [],
          evaluationTitle: 'Rubric 2',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalEvaluationAverage',
          name: 'Template 2 - Rubric 1 - Average',
          options: [],
          evaluationTitle: 'Rubric 1',
          templateId: template2Id
        },
        {
          id: v4(),
          type: 'proposalEvaluationTotal',
          name: 'Template 2 - Rubric 1 - Total',
          options: [],
          evaluationTitle: 'Rubric 1',
          templateId: template2Id
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        project: [],
        projectMember: [],
        templateProperties: [
          {
            formFields: [],
            templateId: template1Id,
            rubricEvaluations: [
              {
                properties: ['average'],
                title: 'Rubric 1',
                evaluationId: v4()
              },
              {
                properties: ['average', 'total'],
                title: 'Rubric 2',
                evaluationId: v4()
              }
            ]
          },
          {
            formFields: [],
            templateId: template2Id,
            rubricEvaluations: [
              {
                properties: ['total'],
                title: 'Rubric 1',
                evaluationId: v4()
              }
            ]
          }
        ]
      },
      evaluationSteps: [
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [],
          title: 'Rubric 1',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [],
          title: 'Rubric 2',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 2',
              id: template2Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [],
          title: 'Rubric 1',
          type: 'rubric'
        }
      ]
    });

    const rubric1AverageTemplate1 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 1' && p.templateId === template1Id && p.type === 'proposalEvaluationAverage'
    );
    const rubric1TotalTemplate1 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 1' && p.templateId === template1Id && p.type === 'proposalEvaluationTotal'
    );
    const rubric2AverageTemplate1 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 2' && p.templateId === template1Id && p.type === 'proposalEvaluationAverage'
    );
    const rubric2TotalTemplate1 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 2' && p.templateId === template1Id && p.type === 'proposalEvaluationTotal'
    );
    const rubric1AverageTemplate2 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 1' && p.templateId === template2Id && p.type === 'proposalEvaluationAverage'
    );
    const rubric1TotalTemplate2 = properties.find(
      (p) => p.evaluationTitle === 'Rubric 1' && p.templateId === template2Id && p.type === 'proposalEvaluationTotal'
    );

    expect(properties.length).toBe(4);
    expect(rubric1AverageTemplate1).toBeTruthy();
    expect(rubric1TotalTemplate1).toBeFalsy();
    expect(rubric2AverageTemplate1).toBeTruthy();
    expect(rubric2TotalTemplate1).toBeTruthy();
    expect(rubric1AverageTemplate2).toBeFalsy();
    expect(rubric1TotalTemplate2).toBeTruthy();
  });

  it('Should filter out rubric evaluations criteria reviewer properties that are not selected', () => {
    const template1Id = v4();
    const template2Id = v4();
    const reviewer1Id = v4();
    const reviewer2Id = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 1 - Rubric 1 - Criteria 1 - User 1 - Comment',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 1 - Rubric 1 - Criteria 1 - User 1 - Score',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 1 - Rubric 1 - Criteria 2 - User 1 - Comment',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 1 - Rubric 1 - Criteria 2 - User 1 - Score',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 1 - Rubric 1 - Criteria 2 - User 2 - Comment',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id,
          reviewerId: reviewer2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 1 - Rubric 1 - Criteria 2 - User 2 - Score',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id,
          reviewerId: reviewer2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 1 - Rubric 2 - Criteria 1 - User 1 - Comment',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 1 - Rubric 2 - Criteria 1 - User 1 - Score',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 1 - Rubric 2 - Criteria 1 - User 2 - Comment',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 1 - Rubric 2 - Criteria 1 - User 2 - Score',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id,
          reviewerId: reviewer2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerComment',
          name: 'Template 2 - Rubric 1 - Criteria 1 - User 1 - Comment',
          options: [],
          reviewerId: reviewer1Id,
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaReviewerScore',
          name: 'Template 2 - Rubric 1 - Criteria 1 - User 1 - Score',
          options: [],
          reviewerId: reviewer1Id,
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template2Id
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        project: [],
        projectMember: [],
        templateProperties: [
          {
            formFields: [],
            templateId: template1Id,
            rubricEvaluations: [
              {
                properties: ['reviewerComment', 'reviewerScore'],
                title: 'Rubric 1',
                evaluationId: v4()
              },
              {
                properties: ['reviewerComment'],
                title: 'Rubric 2',
                evaluationId: v4()
              }
            ]
          },
          {
            formFields: [],
            templateId: template2Id,
            rubricEvaluations: [
              {
                properties: ['reviewerScore'],
                title: 'Rubric 1',
                evaluationId: v4()
              }
            ]
          }
        ]
      },
      evaluationSteps: [
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: reviewer1Id,
                    username: 'User 1'
                  }
                }
              ]
            },
            {
              title: 'Criteria 2',
              answers: [
                {
                  user: {
                    id: reviewer1Id,
                    username: 'User 1'
                  }
                },
                {
                  user: {
                    id: reviewer2Id,
                    username: 'User 2'
                  }
                }
              ]
            }
          ],
          title: 'Rubric 1',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: reviewer1Id,
                    username: 'User 1'
                  }
                },
                {
                  user: {
                    id: reviewer2Id,
                    username: 'User 2'
                  }
                }
              ]
            }
          ],
          title: 'Rubric 2',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 2',
              id: template2Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: reviewer1Id,
                    username: 'User 1'
                  }
                }
              ]
            }
          ],
          title: 'Rubric 1',
          type: 'rubric'
        }
      ]
    });

    const rubric1Reviewer1CommentTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer1ScoreTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric1Reviewer1CommentTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer1ScoreTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric1Reviewer2CommentTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer2ScoreTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric2Reviewer1CommentTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric2Reviewer1ScoreTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric2Reviewer2CommentTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric2Reviewer2ScoreTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric1Reviewer1CommentTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer1ScoreTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer1Id &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric1Reviewer2CommentTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer2ScoreTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );
    const rubric1Reviewer2CommentTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerComment'
    );
    const rubric1Reviewer2ScoreTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.reviewerId === reviewer2Id &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaReviewerScore'
    );

    expect(properties.length).toBe(9);
    expect(rubric1Reviewer1CommentTemplate1Criteria1).toBeTruthy();
    expect(rubric1Reviewer1ScoreTemplate1Criteria1).toBeTruthy();
    expect(rubric1Reviewer1CommentTemplate1Criteria2).toBeTruthy();
    expect(rubric1Reviewer1ScoreTemplate1Criteria2).toBeTruthy();
    expect(rubric1Reviewer2CommentTemplate1Criteria2).toBeTruthy();
    expect(rubric1Reviewer2ScoreTemplate1Criteria2).toBeTruthy();
    expect(rubric2Reviewer1CommentTemplate1Criteria1).toBeTruthy();
    expect(rubric2Reviewer1ScoreTemplate1Criteria1).toBeFalsy();
    expect(rubric2Reviewer2CommentTemplate1Criteria1).toBeTruthy();
    expect(rubric2Reviewer2ScoreTemplate1Criteria1).toBeFalsy();
    expect(rubric1Reviewer1CommentTemplate2Criteria1).toBeFalsy();
    expect(rubric1Reviewer1ScoreTemplate2Criteria1).toBeTruthy();
    expect(rubric1Reviewer2CommentTemplate2Criteria1).toBeFalsy();
    expect(rubric1Reviewer2ScoreTemplate2Criteria1).toBeFalsy();
    expect(rubric1Reviewer2CommentTemplate1Criteria1).toBeFalsy();
    expect(rubric1Reviewer2ScoreTemplate1Criteria1).toBeFalsy();
  });

  it(`Should filter out rubric criterial total properties that are not selected`, () => {
    const template1Id = v4();
    const template2Id = v4();
    const properties = filterBoardProperties({
      boardProperties: [
        {
          id: v4(),
          type: 'proposalRubricCriteriaAverage',
          name: 'Template 1 - Rubric 1 - Criteria 1 - Average',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Template 1 - Rubric 1 - Criteria 1 - Total',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaAverage',
          name: 'Template 1 - Rubric 1 - Criteria 2 - Average',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Template 1 - Rubric 1 - Criteria 2 - Total',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 2',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaAverage',
          name: 'Template 1 - Rubric 2 - Criteria 1 - Average',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Template 1 - Rubric 2 - Criteria 1 - Total',
          options: [],
          evaluationTitle: 'Rubric 2',
          criteriaTitle: 'Criteria 1',
          templateId: template1Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaAverage',
          name: 'Template 2 - Rubric 1 - Criteria 1 - Average',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template2Id
        },
        {
          id: v4(),
          type: 'proposalRubricCriteriaTotal',
          name: 'Template 2 - Rubric 1 - Criteria 1 - Total',
          options: [],
          evaluationTitle: 'Rubric 1',
          criteriaTitle: 'Criteria 1',
          templateId: template2Id
        }
      ],
      proposalCustomProperties: [],
      selectedProperties: {
        customProperties: [],
        defaults: [],
        project: [],
        projectMember: [],
        templateProperties: [
          {
            formFields: [],
            templateId: template1Id,
            rubricEvaluations: [
              {
                properties: ['criteriaAverage', 'criteriaTotal'],
                title: 'Rubric 1',
                evaluationId: v4()
              },
              {
                properties: ['criteriaAverage'],
                title: 'Rubric 2',
                evaluationId: v4()
              }
            ]
          },
          {
            formFields: [],
            templateId: template2Id,
            rubricEvaluations: [
              {
                properties: ['criteriaTotal'],
                title: 'Rubric 1',
                evaluationId: v4()
              }
            ]
          }
        ]
      },
      evaluationSteps: [
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: []
            },
            {
              title: 'Criteria 2',
              answers: []
            }
          ],
          title: 'Rubric 1',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 1',
              id: template1Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: []
            }
          ],
          title: 'Rubric 2',
          type: 'rubric'
        },
        {
          proposal: {
            page: {
              title: 'Template 2',
              id: template2Id,
              type: 'proposal_template'
            }
          },
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: []
            }
          ],
          title: 'Rubric 1',
          type: 'rubric'
        }
      ]
    });

    const rubric1AverageTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaAverage'
    );

    const rubric1TotalTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaTotal'
    );

    const rubric1AverageTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaAverage'
    );

    const rubric1TotalTemplate1Criteria2 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 2' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaTotal'
    );

    const rubric2AverageTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaAverage'
    );

    const rubric2TotalTemplate1Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 2' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template1Id &&
        p.type === 'proposalRubricCriteriaTotal'
    );

    const rubric1AverageTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaAverage'
    );

    const rubric1TotalTemplate2Criteria1 = properties.find(
      (p) =>
        p.evaluationTitle === 'Rubric 1' &&
        p.criteriaTitle === 'Criteria 1' &&
        p.templateId === template2Id &&
        p.type === 'proposalRubricCriteriaTotal'
    );

    expect(properties.length).toBe(6);
    expect(rubric1AverageTemplate1Criteria1).toBeTruthy();
    expect(rubric1TotalTemplate1Criteria1).toBeTruthy();
    expect(rubric1AverageTemplate1Criteria2).toBeTruthy();
    expect(rubric1TotalTemplate1Criteria2).toBeTruthy();

    expect(rubric2AverageTemplate1Criteria1).toBeTruthy();
    expect(rubric2TotalTemplate1Criteria1).toBeFalsy();

    expect(rubric1AverageTemplate2Criteria1).toBeFalsy();
    expect(rubric1TotalTemplate2Criteria1).toBeTruthy();
  });
});
