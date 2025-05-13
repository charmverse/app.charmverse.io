import { prisma } from '@charmverse/core/prisma-client';
import { writeToSameFolder } from 'lib/utils/file';

async function checkSelectFields({ spaceDomain, templatePath }: { templatePath: string; spaceDomain: string }) {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: { path: templatePath, type: 'proposal_template' },
      space: {
        domain: spaceDomain
      }
    },
    select: {
      formId: true,
      form: {
        include: {
          formFields: {
            where: {
              type: {
                in: ['select', 'multiselect']
              }
            }
          }
        }
      }
    }
  });

  await writeToSameFolder({
    fileName: 'selectFields.ts',
    data: `export const selectFields = ${JSON.stringify(proposal.form!.formFields, null, 2)}`
  });
}

// resolveFields({templatePath: 'page-path', spaceDomain: 'space-domain'}).then(console.log)
