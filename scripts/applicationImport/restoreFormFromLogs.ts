// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';
import { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { createProposal } from 'lib/proposals/createProposal';
import { upsertProposalFormFields } from '@root/lib/proposals/forms/upsertProposalFormFields';
import { exportRoles } from 'lib/templates/exportRoles';
import { importRoles } from 'lib/templates/importRoles';
import { v4 as uuid } from 'uuid';

// This file should be created by exporting form fields for a proposal
// import {formFields} from './form'

async function restoreFormFromLogs({
  pagePath,
  spaceDomain,
  inputs
}: {
  pagePath: string;
  spaceDomain: string;
  inputs: (FormFieldInput & { formId?: string })[];
}): Promise<any> {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: pagePath,
      space: {
        domain: spaceDomain
      }
    },
    select: {
      proposal: {
        select: {
          id: true,
          form: true,
          formId: true
        }
      }
    }
  });

  if (!page.proposal?.form) {
    throw new Error('Proposal does not have a form');
  }

  await upsertProposalFormFields({
    proposalId: page.proposal.id,
    formFields: inputs.map((field) => ({ ...field, formId: page.proposal!.formId, id: uuid() }))
  });

  console.log('Form restored successfully with', inputs.length, 'fields');
}

async function reimportTemplateSettings({
  spaceDomain,
  templatePath,
  targetSpaceDomain
}: {
  spaceDomain: string;
  templatePath: string;
  targetSpaceDomain: string;
}) {
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: { path: templatePath, type: 'proposal_template' },
      space: {
        domain: spaceDomain
      },
      workflowId: {
        not: null
      }
    },
    select: {
      workflow: true,
      evaluations: {
        include: {
          reviewers: true,
          rubricCriteria: true
        }
      },
      spaceId: true,
      page: {
        select: {
          title: true
        }
      }
    }
  });

  const exportedRoles = await exportRoles({ spaceIdOrDomain: proposal.spaceId });

  // Begin importing data -------------------------------------
  const targetSpace = await prisma.space.findFirstOrThrow({
    where: {
      domain: targetSpaceDomain
    }
  });

  const { oldNewRecordIdHashMap } = await importRoles({
    exportData: exportedRoles,
    targetSpaceIdOrDomain: targetSpace.id
  });

  // Just in case a default workflow with same name exists
  const customIndex = 209;

  let existingWorkflow = await prisma.proposalWorkflow.findFirst({
    where: {
      spaceId: targetSpace.id,
      index: customIndex
    }
  });

  if (!existingWorkflow) {
    existingWorkflow = await prisma.proposalWorkflow.create({
      data: {
        evaluations: proposal.workflow!.evaluations as any,
        index: customIndex,
        title: proposal.workflow!.title,
        space: { connect: { id: targetSpace.id } }
      }
    });
  }

  const newTemplate = await createProposal({
    authors: [],
    evaluations: proposal.evaluations.map((evaluation) => ({
      id: uuid(),
      index: evaluation.index,
      title: evaluation.title,
      rubricCriteria: evaluation.rubricCriteria as any,
      type: evaluation.type,
      voteSettings: evaluation.voteSettings as any,
      reviewers: evaluation.reviewers.map((reviewer) => ({
        userId: targetSpace.createdBy,
        roleId: reviewer.roleId ? oldNewRecordIdHashMap[reviewer.roleId] : undefined,
        systemRole: reviewer.systemRole
      }))
    })),
    spaceId: targetSpace.id,
    workflowId: existingWorkflow.id,
    formFields: [
      {
        id: uuid(),
        description: '',
        fieldConfig: {},
        index: 0,
        name: 'title',
        type: 'short_text',
        required: true,
        private: false
      }
    ],
    userId: targetSpace.createdBy,
    pageProps: {
      title: proposal.page!.title,
      type: 'proposal_template'
    }
  });

  return newTemplate;
}

// restoreFormFromLogs({
//   pagePath: 'general-grant-application-34447243187027476',
//   inputs: formFields as any,
//   spaceDomain: 'mute-fuchsia-louse'
// }).then(console.log)

// reimportTemplateSettings({
//   spaceDomain: 'target-space',
//   templatePath: 'grant-application',
//   targetSpaceDomain: 'mute-fuchsia-louse',
// }).then((t) => console.log(t.page.path))

// prisma.formField.deleteMany({}).then(console.log)
