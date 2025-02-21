import { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { FormField, prisma } from '@charmverse/core/prisma-client';
import { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import type { FieldAnswerInput, FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { readFileSync } from 'fs';
import { upsertProposalFormAnswers } from '@root/lib/proposals/forms/upsertProposalFormAnswers';
import { ProposalEvaluationInput, createProposal } from 'lib/proposals/createProposal';
import { ProposalPendingReward } from 'lib/proposals/interfaces';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';
import _uniqBy from 'lodash/uniqBy';
import Papa from 'papaparse';
import * as path from 'path';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';
import { v4 as uuid } from 'uuid';

function readCSV(filename: string) {
  const csvFile = path.resolve('scripts', filename);

  const content = readFileSync(csvFile).toString();
  var { data: rows } = Papa.parse<string[]>(content);

  // Transform function to normalise fields
  const headers = rows[0].map((header) => header.trim().replace('*', '').toLowerCase());

  return rows.slice(1, rows.length).map((values) => {
    return values.reduce<Record<string, string>>((acc, field, index) => {
      const header = headers[index];
      const fieldName = header;

      if (fieldName) {
        acc[fieldName] = field;
      } else {
        console.error('No field match for CSV column: ', fieldName);
      }

      // override for testing

      return acc;
    }, {});
  });
}

async function importApplications({
  templatePath,
  spaceDomain,
  filename
}: {
  templatePath: string;
  spaceDomain: string;
  filename: string;
}): Promise<void> {
  const data = await readCSV(filename);

  const formProposal = await prisma.proposal.findFirstOrThrow({
    where: {
      formId: {
        not: null
      },
      page: {
        path: templatePath,
        type: 'proposal_template'
      },
      space: {
        domain: spaceDomain
      }
    },
    include: {
      page: {
        select: {
          id: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          rubricCriteria: true,
          reviewers: true
        }
      },
      form: {
        include: {
          formFields: true
        }
      }
    }
  });

  const workflow = (await prisma.proposalWorkflow.findFirstOrThrow({
    where: {
      id: formProposal.workflowId!
    }
  })) as ProposalWorkflowTyped;

  const populatedWorkflowSteps = formProposal.evaluations.map((templateStep, index) => {
    const workflowStep = workflow.evaluations[index];

    if (templateStep.title !== workflowStep.title) {
      throw new Error(`Workflow step title mismatch: ${templateStep.title} !== ${workflowStep.title}`);
    }

    return {
      id: uuid(),
      index,
      reviewers: templateStep.reviewers.map((r) => ({ roleId: r.roleId, userId: r.userId, systemRole: r.systemRole })),
      rubricCriteria: templateStep.rubricCriteria.map((c) => ({
        parameters: c.parameters,
        title: c.title,
        type: c.type,
        description: c.description
      })),
      title: templateStep.title,
      type: templateStep.type,
      voteSettings: templateStep.voteSettings
    } as ProposalEvaluationInput;
  });

  const formId = formProposal.formId as string;

  const formQuestions = formProposal.form!.formFields.reduce(
    (acc, val) => {
      acc[val.name.trim().toLowerCase()] = val;
      acc[val.id] = val;
      return acc;
    },
    {} as Record<string, FormField>
  );

  // for (let i=0; i< 5; i++) {

  for (let i = 0; i < data.length; i++) {
    const userAnswers = data[i];

    delete userAnswers['milestones'];

    const missingFormField = Object.keys(userAnswers).find((key) => {
      return !formQuestions[key.toLowerCase().trim()];
    });

    const proposalTitle = userAnswers['project name'];

    if (missingFormField) {
      throw new Error(`Missing form field inside proposal: ${missingFormField}`);
    }

    const email = userAnswers['email address'].toLowerCase();

    if (!email) {
      throw new Error('Missing email address for proposal index');
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            verifiedEmails: {
              some: {
                email
              }
            }
          },
          {
            googleAccounts: {
              some: {
                email
              }
            }
          }
        ]
      },
      include: {
        spaceRoles: {
          where: {
            spaceId: formProposal.spaceId
          }
        }
      }
    });

    if (user && !user.spaceRoles.length) {
      await addUserToSpace({ userId: user.id, spaceId: formProposal.spaceId });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: email,
          path: uuid(),
          verifiedEmails: {
            create: {
              email,
              avatarUrl: '',
              name: email
            }
          },
          spaceRoles: {
            create: {
              spaceId: formProposal.spaceId
            }
          }
        },
        include: {
          spaceRoles: {
            where: {
              spaceId: formProposal.spaceId
            }
          }
        }
      });
    }

    let proposal = await prisma.proposal.findFirst({
      where: {
        formId,
        createdBy: user.id,
        page: {
          type: 'proposal'
        }
      },
      select: {
        id: true
      }
    });

    if (!proposal) {
      const createdProposal = await createProposal({
        userId: user.id,
        formId,
        authors: [user.id],
        evaluations: populatedWorkflowSteps,
        spaceId: formProposal.spaceId,
        workflowId: formProposal.workflowId!,
        fields: formProposal.fields as any,
        isDraft: true,
        selectedCredentialTemplates: formProposal.selectedCredentialTemplates,
        pageProps: {
          title: proposalTitle,
          sourceTemplateId: formProposal.page!.id
        }
      });

      proposal = {
        id: createdProposal.proposal.id
      };
    }

    const selectValueModifiers: Record<string, SelectOptionType[]> = {};

    const answers: FieldAnswerInput[] = await Promise.all(
      Object.entries(userAnswers).map(async ([key, value]) => {
        const field = formQuestions[key.toLowerCase().trim()];
        let populatedValue = value;

        if (value && (field.type === 'select' || field.type === 'multiselect')) {
          const matchingOption = (field.options as FormFieldInput['options'])?.find(
            (option) => option.name.toLowerCase() === value.trim().toLowerCase()
          );

          if (!matchingOption) {
            if (!selectValueModifiers[field.id]) {
              selectValueModifiers[field.id] = [];
            }
            const newOptionId = uuid();
            selectValueModifiers[field.id].push({
              id: newOptionId,
              color: getRandomThemeColor(),
              name: value
            });
            populatedValue = newOptionId;
          } else {
            populatedValue = matchingOption.id;
          }
        } else if (field.type === 'long_text') {
          const parsedContent = await parseMarkdown(value);
          populatedValue = {
            content: parsedContent,
            contentText: value
          } as any;
        } else if (field.type === 'file' && value) {
          populatedValue = {
            url: value
          } as any;
        }

        return {
          fieldId: field.id,
          value: populatedValue
        };
      })
    );

    const fieldsToModify = Object.keys(selectValueModifiers);

    for (const fieldId of fieldsToModify) {
      const fieldInDb = await prisma.formField.findFirstOrThrow({
        where: {
          id: fieldId
        },
        select: {
          options: true
        }
      });

      const existingFieldOptions = (fieldInDb.options as FormFieldInput['options']) ?? [];

      const filteredNewOptions = selectValueModifiers[fieldId].filter((option) => {
        return !existingFieldOptions.find(
          (existingOption) => existingOption.name.toLowerCase().trim() === option.name.toLowerCase().trim()
        );
      });

      if (filteredNewOptions.length) {
        await prisma.formField.update({
          where: {
            id: fieldId
          },
          data: {
            options: existingFieldOptions.concat(filteredNewOptions)
          }
        });
      }
    }

    await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers
    });

    console.log('Processed', i + 1, 'proposals / ', data.length);
  }
}

function parseMilestones({
  text,
  reviewers: _reviewers,
  authorId
}: {
  text: string;
  reviewers: { id: string; group: 'role' | 'user' }[];
  authorId: string;
}): ProposalPendingReward[] {
  const milestones: ProposalPendingReward[] = [];
  const splitMilestones = text
    .split('///SEP///')
    .map((m) => m.trim())
    .filter((m) => m !== '');

  const titleMatcher = /__TITLE__(.){2,}__TITLE__/;

  const reviewers = _reviewers.map((review) =>
    review.group === 'role' ? { roleId: review.id } : { userId: review.id }
  );

  splitMilestones.forEach((milestone) => {
    const titleMatch = milestone.match(titleMatcher);

    const rawTitle = titleMatch?.[0] ?? 'Untitled';

    const title = rawTitle.replace(/__TITLE__/g, '').trim();
    const content = milestone.replace(rawTitle, '').trim();

    const parsedContent = parseMarkdown(content);

    milestones.push({
      draftId: uuid(),
      // TODO - CONFIRM REWARDS
      reward: {
        customReward: 'Grant from Aptos',
        rewardType: 'custom',
        rewardAmount: null,
        rewardToken: null,
        chainId: null,
        reviewers,
        assignedSubmitters: [authorId],
        fields: {
          isAssigned: true,
          properties: {
            __limit: '',
            __title: title,
            __rewarder: '',
            __available: 1,
            __createdAt: Date.now(),
            __reviewers: reviewers,
            __applicants: [authorId],
            __rewardChain: '',
            __rewardToken: '',
            __rewardAmount: '',
            __rewardStatus: '',
            __rewardCustomValue: 'Grant from Aptos',
            __rewardProposalLink: '',
            __rewardApplicantsCount: 1
          }
        }
      },
      page: {
        content: parsedContent,
        contentText: content,
        title,
        type: 'bounty'
      }
    });
  });

  return milestones;
}

async function importMilestones({ sourceData, spaceDomain }: { sourceData: string; spaceDomain: string }) {
  const data = readCSV(sourceData);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const email = item['email address'].toLowerCase().trim();

    if (!email) {
      throw new Error(`Missing email address for proposal index ${email}`);
    }

    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        page: {
          author: {
            verifiedEmails: {
              some: {
                email: {
                  equals: email,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        formId: {
          not: null
        },
        space: {
          domain: spaceDomain
        }
      },
      select: {
        id: true,
        fields: true,
        page: {
          select: {
            path: true,
            author: {
              select: {
                id: true,
                verifiedEmails: true
              }
            }
          }
        },
        evaluations: {
          select: {
            reviewers: {
              where: {
                OR: [
                  {
                    roleId: {
                      not: null
                    }
                  },
                  {
                    userId: {
                      not: null
                    }
                  }
                ]
              }
            }
          }
        }
      }
    });

    if (proposal.page?.author.verifiedEmails[0].email !== email) {
      throw new Error(`Invalid user for proposal ${email} expected ${proposal.page?.author.verifiedEmails[0].email}`);
    }

    const authorId = proposal.page.author.id;

    const flatReviewers = proposal.evaluations.map((r) => r.reviewers).flat();

    const reviewers = _uniqBy(
      flatReviewers.map((r) => ({ id: r.userId ?? (r.roleId as string), group: r.userId ? 'user' : 'role' })),
      'id'
    ) as { id: string; group: 'user' | 'role' }[];

    if (reviewers.some((r) => !r.id)) {
      throw new Error('Invalid reviewer found for proposal');
    } else if (!reviewers.length) {
      throw new Error('No reviewers found for proposal');
    }

    const parsedInput = {
      email: item['email address'],
      milestones: parseMilestones({ text: item.milestones, authorId, reviewers })
    };

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          ...((proposal.fields ?? {}) as any),
          enableRewards: true,
          pendingRewards: parsedInput.milestones
        }
      }
    });

    console.log('Processed item', i + 1, '/', data.length, 'with', parsedInput.milestones.length, 'milestones');
  }
}

// importMilestones({sourceData: 'data.csv', spaceDomain: 'space-domain'}).then(console.log)

// importApplications({templatePath: 'proposal-form-5212482570918344', spaceDomain: 'coloured-tomato-gibbon', filename: 'example-data.csv'}).then(console.log)

// prisma.page.deleteMany({where: {space: {domain: 'coloured-tomato-gibbon'}, type: 'proposal'}}).then(console.log)
