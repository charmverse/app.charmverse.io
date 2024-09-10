import { prisma } from '@charmverse/core/prisma-client';
import { readFile, writeFile } from 'node:fs/promises';
// retrieve template from production to determine fields
import { v4 as uuid } from 'uuid';
const exportFile = './retro-pgf-proposal-template.json';
const devSpaceId = 'e9923c04-9001-429b-8e52-69293d62cf12';

async function query() {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      space: {
        domain: 'op-retrofunding-review-process'
      },
      path: 'retro-funding-5-review-7141855747387555',
      type: 'proposal_template'
    },
    include: {
      proposal: {
        include: {
          evaluations: true,
          reviewers: true,
          rubricCriteria: true,
          form: {
            include: {
              formFields: true
            }
          }
        }
      }
    }
  });
  console.log('formFields:', page.proposal!.form!.formFields);
  const fieldMap = page.proposal!.form!.formFields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = field.id;
    return acc;
  }, {});
  console.log('Template title:', page.title);
  console.log('Template id:', page.id);
  console.log('Template space id:', page.spaceId);
  console.log('Form questions:\n', fieldMap);

  await writeFile(exportFile, JSON.stringify(page, null, 2));
}

async function importToDev() {
  const template = JSON.parse(await readFile(exportFile, 'utf-8')) as any;

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: devSpaceId
    },
    include: {
      spaceRoles: true
    }
  });
  const newUserId = space.spaceRoles[0]?.userId || '';
  template.spaceId = space.id;
  template.createdBy = newUserId;
  template.updatedBy = newUserId;
  template.proposal!.createdBy = newUserId;
  template.proposal!.spaceId = space.id;
  template.proposal!.workflowId = null;
  const { proposal: proposalTemplate, ...page } = template;
  const { evaluations, rubricCriteria, form: formTemplate, reviewers, ...proposal } = proposalTemplate!;
  const { formFields, ...form } = formTemplate!;

  // remove old versions
  await prisma.page.deleteMany({
    where: {
      id: page.id
    }
  });
  await prisma.form.deleteMany({
    where: {
      id: form.id
    }
  });

  // save the page, proposal, form, rubricCriteria, evaluations, and formFields
  await prisma.$transaction([
    prisma.form.create({
      data: form
    }),
    prisma.proposal.create({
      data: { ...proposal, fields: proposal.fields as any }
    }),
    prisma.page.create({
      data: {
        ...page,
        content: page.content as any
      }
    }),
    prisma.proposalEvaluation.createMany({
      data: evaluations.map((e: any) => ({ ...e, voteSettings: e.voteSettings as any }))
    }),
    prisma.proposalRubricCriteria.createMany({
      data: rubricCriteria.map((c: any) => ({ ...c, parameters: c.parameters as any }))
    }),
    prisma.formField.createMany({
      data: formFields.map((f: any) => ({
        ...f,
        fieldConfig: f.fieldConfig as any,
        description: f.description as any,
        options: f.options as any
      }))
    })
  ]);
  console.log('Template imported to dev: ' + 'http://localhost:3000/' + space.domain + '/' + page.path);
}

// run with production env
//query();

// run with local env
importToDev();
