// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';
import { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { createForm } from '@root/lib/proposals/forms/createForm';
import { v4 } from 'uuid';

async function splitStructuredProposalForms() {
  // Get all structured proposal templates
  const proposalTemplates = await prisma.proposal.findMany({
    where: {
      page: {
        type: 'proposal_template'
      },
      formId: {
        not: null
      }
    },
    select: {
      id: true,
      form: {
        select: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      },
      page: {
        select: {
          id: true
        }
      },
      formId: true
    }
  });

  const existingFormIds: Set<string> = new Set();
  const totalProposals = proposalTemplates.length;
  let currentProposal = 0;

  for (const proposalTemplate of proposalTemplates) {
    try {
      if (!proposalTemplate.formId || !proposalTemplate.form || !proposalTemplate.page) {
        continue;
      }
      if (existingFormIds.has(proposalTemplate.formId)) {
        const newFormFieldIds = proposalTemplate.form.formFields.map(() => v4());
        // Create new form with new form field ids
        const newFormId = await createForm(
          proposalTemplate.form.formFields.map((formField, index) => ({
            ...formField,
            id: newFormFieldIds[index],
            options: formField.options as SelectOptionType[]
          }))
        );

        // Get all the proposals that use this template
        const proposals = await prisma.proposal.findMany({
          where: {
            page: {
              sourceTemplateId: proposalTemplate.page.id
            }
          },
          select: {
            formAnswers: {
              select: {
                id: true
              }
            }
          }
        });

        await prisma.$transaction([
          prisma.proposal.update({
            where: {
              id: proposalTemplate.id
            },
            data: {
              formId: newFormId
            }
          }),
          // Update the form id for all proposals that use this template
          prisma.proposal.updateMany({
            where: {
              page: {
                sourceTemplateId: proposalTemplate.page.id
              }
            },
            data: {
              formId: newFormId
            }
          }),
          // Update the form field ids for all form answers for all proposals that use this template
          ...proposals
            .map((proposal) =>
              proposal.formAnswers.map((formAnswer, index) =>
                prisma.formFieldAnswer.update({
                  where: {
                    id: formAnswer.id
                  },
                  data: {
                    fieldId: newFormFieldIds[index]
                  }
                })
              )
            )
            .flat()
        ]);
      }
      existingFormIds.add(proposalTemplate.formId);
    } catch (err) {
      console.log(`Failed to split proposal template ${proposalTemplate.id}`);
    } finally {
      currentProposal++;
      console.log(`Completed ${currentProposal}/${totalProposals} proposals`);
    }
  }
}

splitStructuredProposalForms();
