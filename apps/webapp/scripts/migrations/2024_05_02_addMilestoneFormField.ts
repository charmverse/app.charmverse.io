import { prisma } from '@charmverse/core/prisma-client';

async function addMilestoneFormField() {
  const proposals = await prisma.proposal.findMany({
    where: {
      formId: {
        not: null
      }
    },
    select: {
      formId: true
    }
  });

  const uniqueFormIds = Array.from(new Set(proposals.map((proposal) => proposal.formId))) as string[];
  const totalForms = uniqueFormIds.length;
  let currentForm = 0;

  for (const formId of uniqueFormIds) {
    try {
      const form = await prisma.form.findUniqueOrThrow({
        where: {
          id: formId
        },
        select: {
          formFields: {
            select: {
              index: true
            }
          }
        }
      });

      const highestIndex = Math.max(...form.formFields.map((field) => field.index));
      await prisma.formField.create({
        data: {
          formId,
          type: 'milestone',
          name: 'Milestone',
          required: false,
          index: highestIndex !== -1 ? highestIndex + 1 : -1
        }
      });
    } catch (e) {
      console.error(`Error adding milestone field to form ${formId}`, e);
    } finally {
      currentForm++;
      console.log(`Processed ${currentForm} of ${totalForms} forms`);
    }
  }
}

addMilestoneFormField().then(() => console.log('Done!'));
