import { prisma } from '@charmverse/core/prisma-client';

import { writeToSameFolder } from 'lib/utils/file';
import { prettyPrint } from '@packages/utils/strings';

async function exportForm({ spaceDomain, templatePath }: { spaceDomain: string; templatePath: string }) {
  const form = await prisma.proposal.findFirstOrThrow({
    where: {
      space: {
        domain: spaceDomain
      },
      page: {
        path: templatePath,
        type: 'proposal_template'
      }
    },
    include: {
      form: {
        include: {
          formFields: true
        }
      }
    }
  });

  await writeToSameFolder({ fileName: 'form.json', data: JSON.stringify(form.form?.formFields, null, 2) });

  prettyPrint(form?.form?.formFields.map((field) => field.name));
}

exportForm({ spaceDomain: 'aptos-grants', templatePath: 'general-grant-application-13916139412961637' }).then(
  prettyPrint
);
