import { getFormInput, getProjectProfileFieldConfig } from '@packages/testing/mocks/form';
import * as constants from '@root/lib/projects/formField';
import { getFieldConfig } from '@root/lib/projects/formField';
import { v4 } from 'uuid';

import type { IPropertyTemplate } from '../../board';
import { getBoardProperties } from '../getBoardProperties';

describe('getBoardProperties', () => {
  it('Should return universal properties for proposals', () => {
    const properties = getBoardProperties({});

    expect(properties.some((r) => r.type === 'proposalUrl')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalStatus')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalAuthor')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationType')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalStep')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalReviewerNotes')).toBeTruthy();
  });

  it('Should return custom properties from proposals', () => {
    const customProperty: IPropertyTemplate = {
      id: 'custom-color',
      name: 'color',
      type: 'multiSelect',
      options: [{ id: 'red', color: 'red', value: 'red' }]
    };
    const properties = getBoardProperties({
      proposalCustomProperties: [
        { id: 'custom-color', name: 'color', type: 'multiSelect', options: [{ id: 'red', color: 'red', value: 'red' }] }
      ]
    });
    expect(properties).toEqual(
      expect.arrayContaining([
        {
          ...customProperty,
          readOnly: true,
          readOnlyValues: true
        }
      ])
    );
  });

  it('Should return custom properties from rubric criteria', () => {
    const user1Id = v4();
    const user2Id = v4();
    const template1Id = v4();
    const template2Id = v4();
    const properties = getBoardProperties({
      evaluationSteps: [
        {
          rubricCriteria: [
            {
              title: 'Rubric Criteria 1',
              description: 'Rubric Criteria 1 Description',
              answers: [
                {
                  user: {
                    id: user1Id,
                    username: 'user1'
                  }
                },
                {
                  user: {
                    id: user2Id,
                    username: 'user2'
                  }
                }
              ]
            },
            {
              title: 'Rubric Criteria 2',
              answers: []
            }
          ],
          title: 'Rubric Evaluation 1',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 1',
              type: 'proposal',
              id: v4(),
              sourceTemplateId: template1Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Rubric Criteria 1',
              description: 'Rubric Criteria 1 new Description',
              answers: []
            },
            {
              title: 'Rubric Criteria 2.1',
              answers: [
                {
                  user: {
                    id: user1Id,
                    username: 'user1'
                  }
                }
              ]
            }
          ],
          title: 'Rubric Evaluation 2',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 2',
              type: 'proposal',
              id: v4(),
              sourceTemplateId: template2Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Rubric Criteria 1',
              description: 'Rubric Criteria 1 Description',
              answers: []
            },
            {
              title: 'Rubric Criteria 2',
              answers: []
            }
          ],
          title: 'Rubric Evaluation 1',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 1',
              type: 'proposal_template',
              id: template1Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Rubric Criteria 1',
              description: 'Rubric Criteria 1 new Description',
              answers: []
            },
            {
              title: 'Rubric Criteria 2.1',
              answers: []
            }
          ],
          title: 'Rubric Evaluation 2',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Template 2',
              type: 'proposal_template',
              id: template2Id
            }
          }
        },
        {
          rubricCriteria: [],
          title: 'Feedback',
          type: 'feedback',
          proposal: {}
        }
      ]
    });

    const rubricCriteria1Property = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 1' && r.type === 'proposalRubricCriteriaTotal'
    );
    const rubricCriteria2Property = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 2' && r.type === 'proposalRubricCriteriaTotal'
    );
    const rubricCriteria21Property = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 2.1' && r.type === 'proposalRubricCriteriaTotal'
    );
    const rubricCriteria1Reviewer1CommentProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 1' &&
        r.type === 'proposalRubricCriteriaReviewerComment' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria1Reviewer1ScoreProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 1' &&
        r.type === 'proposalRubricCriteriaReviewerScore' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria1Reviewer2CommentProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 1' &&
        r.type === 'proposalRubricCriteriaReviewerComment' &&
        r.reviewerId === user2Id
    );
    const rubricCriteria1Reviewer2ScoreProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 1' &&
        r.type === 'proposalRubricCriteriaReviewerScore' &&
        r.reviewerId === user2Id
    );
    const rubricCriteria2Reviewer1CommentProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2' &&
        r.type === 'proposalRubricCriteriaReviewerComment' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria2Reviewer1ScoreProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2' &&
        r.type === 'proposalRubricCriteriaReviewerScore' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria21Reviewer1CommentProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2.1' &&
        r.type === 'proposalRubricCriteriaReviewerComment' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria21Reviewer1ScoreProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2.1' &&
        r.type === 'proposalRubricCriteriaReviewerScore' &&
        r.reviewerId === user1Id
    );
    const rubricCriteria21Reviewer2CommentProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2.1' &&
        r.type === 'proposalRubricCriteriaReviewerComment' &&
        r.reviewerId === user2Id
    );
    const rubricCriteria21Reviewer2ScoreProperty = properties.find(
      (r) =>
        r.criteriaTitle === 'Rubric Criteria 2.1' &&
        r.type === 'proposalRubricCriteriaReviewerScore' &&
        r.reviewerId === user2Id
    );

    expect(rubricCriteria1Property).toBeTruthy();
    expect(rubricCriteria1Reviewer1CommentProperty).toBeTruthy();
    expect(rubricCriteria1Reviewer1ScoreProperty).toBeTruthy();
    expect(rubricCriteria1Reviewer2CommentProperty).toBeTruthy();
    expect(rubricCriteria1Reviewer2ScoreProperty).toBeTruthy();
    const rubricCriteria1AverageProperty = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 1' && r.type === 'proposalRubricCriteriaAverage'
    );
    const rubricCriteria2AverageProperty = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 2' && r.type === 'proposalRubricCriteriaAverage'
    );
    const rubricCriteria21AverageProperty = properties.find(
      (r) => r.criteriaTitle === 'Rubric Criteria 2.1' && r.type === 'proposalRubricCriteriaAverage'
    );

    expect(rubricCriteria1Property).toBeTruthy();
    expect(rubricCriteria2Property).toBeTruthy();
    expect(rubricCriteria21Property).toBeTruthy();
    expect(rubricCriteria1Property).toBeTruthy();
    expect(rubricCriteria1Property?.tooltip).toEqual('Rubric Criteria 1 Description');
    expect(rubricCriteria1AverageProperty).toBeTruthy();

    expect(rubricCriteria2Property).toBeTruthy();
    expect(rubricCriteria2Property?.tooltip).toBe('');
    expect(rubricCriteria2Reviewer1CommentProperty).toBeFalsy();
    expect(rubricCriteria2Reviewer1ScoreProperty).toBeFalsy();
    expect(rubricCriteria2AverageProperty).toBeTruthy();

    expect(rubricCriteria21Property).toBeTruthy();
    expect(rubricCriteria21Reviewer1CommentProperty).toBeTruthy();
    expect(rubricCriteria21Reviewer1ScoreProperty).toBeTruthy();
    expect(rubricCriteria21Reviewer1CommentProperty).toBeTruthy();
    expect(rubricCriteria21Reviewer1ScoreProperty).toBeTruthy();
    expect(rubricCriteria21Reviewer2CommentProperty).toBeFalsy();
    expect(rubricCriteria21Reviewer2ScoreProperty).toBeFalsy();
    expect(rubricCriteria21AverageProperty).toBeTruthy();
  });

  // in case we change our mind about defaults, since all these fields are readonly
  it('Should override previous configuration of custom properties', () => {
    const customProperty: IPropertyTemplate = {
      id: 'custom-color',
      name: 'color',
      type: 'multiSelect' as const,
      options: [{ id: 'red', color: 'red', value: 'red' }]
    };
    const specialId = 'custom-color-mirror-id';
    const properties = getBoardProperties({
      currentCardProperties: [
        {
          ...customProperty,
          id: specialId,
          dynamicOptions: true,
          readOnly: false,
          readOnlyValues: false
        }
      ],
      proposalCustomProperties: [
        { id: 'custom-color', name: 'color', type: 'multiSelect', options: [{ id: 'red', color: 'red', value: 'red' }] }
      ]
    });
    expect(properties).toEqual(
      expect.arrayContaining([
        {
          ...customProperty,
          readOnly: true,
          readOnlyValues: true
        }
      ])
    );
  });

  it('Should return universal properties for rubric steps', () => {
    const properties = getBoardProperties({
      evaluationSteps: [
        {
          title: 'Rubric Evaluation',
          type: 'rubric',
          rubricCriteria: [],
          proposal: {
            page: {
              title: 'Template 1',
              type: 'proposal_template',
              id: v4()
            }
          }
        }
      ]
    });
    expect(properties.some((r) => r.type === 'proposalEvaluatedBy')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationTotal')).toBeTruthy();
    expect(properties.some((r) => r.type === 'proposalEvaluationAverage')).toBeTruthy();
  });

  it('Should retain the id of an existing property when matching by type', () => {
    const properties = getBoardProperties({
      evaluationSteps: [
        {
          title: 'Rubric Evaluation',
          type: 'rubric',
          rubricCriteria: [],
          proposal: {
            page: {
              title: 'Template 1',
              type: 'proposal_template',
              id: v4()
            }
          }
        }
      ]
    });
    const property = properties.find((r) => r.type === 'proposalEvaluatedBy');
    expect(property?.id).toBeTruthy();
    const originalId = property?.id;
    const newProperties = getBoardProperties({
      currentCardProperties: properties,
      evaluationSteps: [
        {
          title: 'Rubric Evaluation',
          type: 'rubric',
          rubricCriteria: [],
          proposal: {}
        }
      ]
    });
    const updatedProperty = newProperties.find((r) => r.type === 'proposalEvaluatedBy');
    expect(updatedProperty?.id).toEqual(originalId);
  });

  it('Should return visible properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProjectProfileFieldConfig()
        })
      ]
    });
    expect(properties.some((r) => r.id === constants.PROJECT_NAME_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_DESCRIPTION_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_TWITTER_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_WEBSITE_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_WALLET_ID)).toBeTruthy();
    // project team members
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_NAMES_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_WALLETS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_EMAILS_ID)).toBeTruthy();
    expect(properties.some((r) => r.id === constants.PROJECT_MEMBER_SOCIAL_URLS_ID)).toBeTruthy();
  });

  it('Should return private properties for project profile', () => {
    const properties = getBoardProperties({
      formFields: [
        getFormInput({
          id: 'project-profile-id',
          type: 'project_profile',
          fieldConfig: getProjectProfileFieldConfig({
            walletAddress: { private: true },
            projectMember: {
              walletAddress: getFieldConfig({ private: true })
            }
          })
        })
      ]
    });
    const projectWalletProperty = properties.find((r) => r.id === constants.PROJECT_WALLET_ID);
    const projectMemberWalletProperty = properties.find((r) => r.id === constants.PROJECT_MEMBER_WALLETS_ID);
    expect(projectWalletProperty).toBeTruthy();
    expect(projectMemberWalletProperty).toBeTruthy();
  });

  it('should return rubric evaluation & criteria properties with custom filter', async () => {
    const user1Id = v4();
    const user2Id = v4();
    const template1Id = v4();
    const template2Id = v4();

    const properties = getBoardProperties({
      selectedProperties: {
        customProperties: [],
        defaults: [],
        project: [],
        projectMember: [],
        templateProperties: [
          {
            formFields: [],
            rubricEvaluations: [
              {
                evaluationId: v4(),
                title: 'Rubric 1',
                properties: ['average', 'total', 'reviewers']
              },
              {
                evaluationId: v4(),
                title: 'Rubric 2',
                properties: ['criteriaTotal', 'criteriaAverage']
              }
            ],
            templateId: template1Id
          },
          {
            formFields: [],
            rubricEvaluations: [
              {
                evaluationId: v4(),
                title: 'Rubric 1',
                properties: ['reviewerScore', 'reviewerComment']
              }
            ],
            templateId: template2Id
          }
        ]
      },
      evaluationSteps: [
        {
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: user1Id,
                    username: 'user1'
                  }
                },
                {
                  user: {
                    id: user2Id,
                    username: 'user2'
                  }
                }
              ]
            },
            {
              title: 'Criteria 2',
              answers: []
            }
          ],
          title: 'Rubric 1',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 1',
              type: 'proposal',
              id: v4(),
              sourceTemplateId: template1Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: user1Id,
                    username: 'user1'
                  }
                }
              ]
            },
            {
              title: 'Criteria 2',
              answers: [
                {
                  user: {
                    id: user2Id,
                    username: 'user2'
                  }
                }
              ]
            }
          ],
          title: 'Rubric 2',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 1',
              type: 'proposal',
              id: v4(),
              sourceTemplateId: template1Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: [
                {
                  user: {
                    id: user1Id,
                    username: 'user1'
                  }
                }
              ]
            }
          ],
          title: 'Rubric 1',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Proposal 2',
              type: 'proposal',
              id: v4(),
              sourceTemplateId: template2Id
            }
          }
        },
        {
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
          type: 'rubric',
          proposal: {
            page: {
              title: 'Template 1',
              type: 'proposal_template',
              id: template1Id
            }
          }
        },
        {
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
          title: 'Rubric 2',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Template 1',
              type: 'proposal_template',
              id: template1Id
            }
          }
        },
        {
          rubricCriteria: [
            {
              title: 'Criteria 1',
              answers: []
            }
          ],
          title: 'Rubric 1',
          type: 'rubric',
          proposal: {
            page: {
              title: 'Template 2',
              type: 'proposal_template',
              id: template2Id
            }
          }
        },
        {
          rubricCriteria: [],
          title: 'Feedback',
          type: 'feedback',
          proposal: {}
        }
      ]
    });

    const template1Rubric1AverageProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluationAverage' && r.templateId === template1Id
    );
    const template1Rubric1TotalProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluationTotal' && r.templateId === template1Id
    );
    const template1Rubric1ReviewersProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluatedBy' && r.templateId === template1Id
    );

    const template1Rubric2AverageProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 2' && r.type === 'proposalEvaluationAverage' && r.templateId === template1Id
    );
    const template1Rubric2TotalProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 2' && r.type === 'proposalEvaluationTotal' && r.templateId === template1Id
    );
    const template1Rubric2ReviewersProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 2' && r.type === 'proposalEvaluatedBy' && r.templateId === template1Id
    );
    const template2Rubric1AverageProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluationAverage' && r.templateId === template2Id
    );
    const template2Rubric1TotalProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluationTotal' && r.templateId === template2Id
    );
    const template2Rubric1ReviewersProperty = properties.find(
      (r) => r.evaluationTitle === 'Rubric 1' && r.type === 'proposalEvaluatedBy' && r.templateId === template2Id
    );

    expect(template1Rubric1AverageProperty).toBeTruthy();
    expect(template1Rubric1TotalProperty).toBeTruthy();
    expect(template1Rubric1ReviewersProperty).toBeTruthy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaTotal' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaAverage' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaReviewerComment' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaReviewerScore' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();

    expect(template1Rubric2AverageProperty).toBeFalsy();
    expect(template1Rubric2TotalProperty).toBeFalsy();
    expect(template1Rubric2ReviewersProperty).toBeFalsy();
    expect(
      properties.filter(
        (property) =>
          property.evaluationTitle === 'Rubric 2' &&
          property.type === 'proposalRubricCriteriaTotal' &&
          property.templateId === template1Id
      ).length
    ).toBe(2);
    expect(
      properties.filter(
        (property) =>
          property.evaluationTitle === 'Rubric 2' &&
          property.type === 'proposalRubricCriteriaAverage' &&
          property.templateId === template1Id
      ).length
    ).toBe(2);

    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 2' &&
          property.type === 'proposalRubricCriteriaReviewerComment' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 2' &&
          property.type === 'proposalRubricCriteriaReviewerScore' &&
          property.templateId === template1Id
      )
    ).toBeFalsy();

    expect(template2Rubric1AverageProperty).toBeFalsy();
    expect(template2Rubric1TotalProperty).toBeFalsy();
    expect(template2Rubric1ReviewersProperty).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaTotal' &&
          property.templateId === template2Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaAverage' &&
          property.templateId === template2Id
      )
    ).toBeFalsy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaReviewerComment' &&
          property.templateId === template2Id
      )
    ).toBeTruthy();
    expect(
      properties.find(
        (property) =>
          property.evaluationTitle === 'Rubric 1' &&
          property.type === 'proposalRubricCriteriaReviewerScore' &&
          property.templateId === template2Id
      )
    ).toBeTruthy();
  });
});
