import { prisma } from "@charmverse/core/prisma-client";
import { FormFieldInput } from "components/common/form/interfaces";
import { upsertProposalFormFields } from "lib/proposals/form/upsertProposalFormFields";




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
  } else if (inputs.some(i => !!i.formId && i.formId !== page.proposal!.form!.id)) {
    throw new Error('Some inputs belong to a different form');
  }

  await upsertProposalFormFields({
    proposalId: page.proposal.id,
    formFields: inputs
  })

  console.log('Form restored successfully with', inputs.length, 'fields')
}

// restoreFormFromLogs({
//   pagePath: 'proposal-form-45254537868421485',
//   inputs: input as any,
//   spaceDomain: 'cvt-calm-indigo-mouse'
// }).then(console.log)