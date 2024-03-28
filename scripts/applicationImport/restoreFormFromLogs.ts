import { prisma } from "@charmverse/core/prisma-client";
import { FormFieldInput } from "components/common/form/interfaces";
import { upsertProposalFormFields } from "lib/proposals/form/upsertProposalFormFields";
import {formFields} from './form'



async function restoreFormFromLogs({pagePath, spaceDomain, inputs}: {pagePath: string; spaceDomain: string; inputs:  (FormFieldInput & {formId?: string})[]}): Promise<any> {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path:pagePath,
      space: {
        domain: spaceDomain
      }
    },
    select: {
      proposal: {
        select: {
          id: true,
          form: true
        }
      }
    }
  });

  if (!page.proposal?.form) {
    throw new Error('Proposal does not have a form');
  }

  await upsertProposalFormFields({
    proposalId: page.proposal.id,
    formFields: inputs
  })

  console.log('Form restored successfully with', inputs.length, 'fields')
}

restoreFormFromLogs({
  pagePath: 'proposal-form-5212482570918344',
  inputs: formFields as any,
  spaceDomain: 'coloured-tomato-gibbon'
}).then(console.log)

// prisma.formField.deleteMany({}).then(console.log)