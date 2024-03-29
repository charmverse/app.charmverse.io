import { readFileSync, writeFileSync } from 'fs';
import { FormFieldAnswer } from '@charmverse/core/prisma';
import Papa from 'papaparse';
import { FormField, Prisma, User, prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';
import { isTruthy } from 'lib/utils/types';
import type { FieldAnswerInput, FormFieldInput, FormFieldValue } from 'components/common/form/interfaces';
import * as path from 'path';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';
import { IPropertyOption, IPropertyTemplate } from 'lib/databases/board';
import { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';
import { prettyPrint } from 'lib/utils/strings';
import { ProposalEvaluationInput, createProposal } from 'lib/proposals/createProposal';
import { ProposalWorkflowTyped } from '@charmverse/core/dist/cjs/proposals';
import { addUserToSpace } from 'testing/utils/spaces';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';

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

      if (fieldName.toLowerCase() !== 'milestones') {
        if (fieldName) {
          acc[fieldName] = field;
        } else if (header) {
          console.error('No field match for CSV column: ', header);
        }
      }
      // override for testing

      return acc;
    }, {});
  });
}

async function importApplications({templatePath, spaceDomain, filename}: {templatePath: string; spaceDomain: string; filename: string}): Promise<void> {
  const data = (await readCSV(filename)).slice(18);

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

  const workflow = await prisma.proposalWorkflow.findFirstOrThrow({
    where: {
      id: formProposal.workflowId!
    }
  }) as ProposalWorkflowTyped;

  const populatedWorkflowSteps = formProposal.evaluations.map((templateStep, index) => {
    const workflowStep = workflow.evaluations[index];

    if (templateStep.title !== workflowStep.title) {
      throw new Error(`Workflow step title mismatch: ${templateStep.title} !== ${workflowStep.title}`);
    }
    
    return {
      id: uuid(),
      index,
      reviewers: templateStep.reviewers.map(r => ({roleId: r.roleId, userId: r.userId, systemRole: r.systemRole})),
      rubricCriteria: templateStep.rubricCriteria.map(c => ({parameters: c.parameters, title:c.title, type: c.type, description: c.description})),
      title: templateStep.title,
      type: templateStep.type,
      voteSettings: templateStep.voteSettings,
    } as ProposalEvaluationInput
  });

  const formId = formProposal.formId as string;

  
  const formQuestions = formProposal.form!.formFields.reduce((acc, val) => {
    acc[val.name.trim().toLowerCase()] = val;
    acc[val.id] = val;
    return acc;
  }, {} as Record<string, FormField>);

  // for (let i=0; i< 5; i++) {

  for (let i=0; i< data.length; i++) {
    const  userAnswers = data[i];

    const missingFormField = Object.keys(userAnswers).find(key => {
      return !formQuestions[key.toLowerCase().trim()]
    });

    const proposalTitle = userAnswers['project name'];

    if (missingFormField) {
      throw new Error(`Missing form field inside proposal: ${missingFormField}`);
    }


    const email = userAnswers['email address'].toLowerCase();

    if (!email) {
      throw new Error('Missing email address for proposal index', );
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{
          verifiedEmails: {
            some: {
              email
            }
          }},
          {
            googleAccounts: {
              some: {
                email
              }
          }
        }]
      },
      include: {
        spaceRoles: {
          where: {
            spaceId: formProposal.spaceId,
          }
        }
      }
    });

    if (user && !user.spaceRoles.length) {
      await addUserToSpace({userId: user.id, spaceId: formProposal.spaceId})
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
              spaceId: formProposal.spaceId,
            }
          }
        }
      })
    }

    let proposal = await prisma.proposal.findFirst({
      where: {
        formId,
        createdBy: user.id,
        page: {
          type:'proposal'
        }
      },
      select: {
        id: true,
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
        proposalTemplateId: formProposal.page!.id,
        fields: formProposal.fields as any,
        isDraft: true,
        selectedCredentialTemplates: formProposal.selectedCredentialTemplates,
        pageProps: {
          title: proposalTitle,
          sourceTemplateId: formProposal.page!.id, 
        },
      })

      proposal = {
        id: createdProposal.proposal.id
      }
    }

    const selectValueModifiers: Record<string, SelectOptionType[]> = {}

    const answers: FieldAnswerInput[] = await Promise.all(Object.entries(userAnswers).map(async([key, value]) => {

      const field = formQuestions[key.toLowerCase().trim()];
      let populatedValue = value;

      if (value && (field.type === 'select' || field.type === 'multiselect')) {

        const matchingOption = (field.options as FormFieldInput['options'])?.find(option => option.name.toLowerCase() === value.trim().toLowerCase());

        if (!matchingOption) {
          if (!selectValueModifiers[field.id]) {
            selectValueModifiers[field.id] = [];
          }
          const newOptionId = uuid();
          selectValueModifiers[field.id].push({
            id: newOptionId,
            color: getRandomThemeColor(),
            name: value,
          });
          populatedValue = newOptionId
        } else {
          populatedValue = matchingOption.id;
        }
      } else if (field.type === 'long_text') {
        const parsedContent = await parseMarkdown(value);
        populatedValue = {
          content: parsedContent,
          contentText: value
        } as any
      } else if (field.type === 'file' && value) {
        populatedValue = {
          url: value
        } as any
      }

      return {
        fieldId: field.id,
        value: populatedValue
      }
    }));

    const fieldsToModify = Object.keys(selectValueModifiers);

    for (const field of fieldsToModify) {
      const existingFieldOptions = formQuestions[field].options as FormFieldInput['options'] ?? [];

      await prisma.formField.update({
        where: {
          id: field
        },
        data: {
          options: existingFieldOptions.concat(selectValueModifiers[field])
        }
      });
    }

    await upsertProposalFormAnswers({
      proposalId: proposal.id,
      answers
    })

    console.log('Processed', i+1, 'proposals / ', data.length);
  }
}

importApplications({templatePath: 'general-grant-application-13916139412961637', spaceDomain: 'aptos-grants', filename: 'Copy of Aptos grants wave 18 & 19 - Data To Upload.csv'}).then(console.log)

// prisma.page.deleteMany({where: {space: {domain: 'coloured-tomato-gibbon'}, type: 'proposal'}}).then(console.log)