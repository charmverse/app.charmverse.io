// @ts-nocheck
import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';
import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';
import { isTruthy } from 'lib/utils/types';
import type { FormFieldValue } from '@root/lib/proposals/forms/interfaces';

// Import rows from a CSV that answer questions on a proposal template
const templateId = '23630cb0-8a55-4bea-acf5-0f65579302e4';
const csvFile = './KyotoFinal.csv';
// set this to override the proposal author
const authorEmailOverride = ''; // 'matt.casey@charmverse.io';

const csvColumnToQuestion: Record<string, string> = {
  // unused
  'Contact type': 'Contact type',
  'Conversion Date': 'Conversion Date',
  'Conversion Page': 'Conversion Page',
  'Conversion Title': 'Conversion Title',
  'Grant Category': 'Grant Category',

  // used to create a user
  Email: 'Point of contact email address',

  // page Title
  Title: 'Title',

  // these go to "Name of primary point of contact"
  'First name': 'First name',
  'Last name': 'Last name',

  // these combine to "Please include links to Website, Litepaper, Whitepaper or Additional Links/URL for your project or yourself."
  'Website URL': 'Website URL',
  'Litepaper/Whitepaper': 'Litepaper/Whitepaper',

  // these combine to "Describe the goals of the grant and how the funds will be used"
  'Grant Description': 'Grant Description',
  'Grant Goals': 'Grant Goals',

  // match a list of options
  'Funding Request': 'Funding Request: Tell us how much USD you require for your project?',
  'Name of project you are looking to secure a grant for': 'Project Name',
  'About You': 'Describe the project.',
  'Positive Impact Measurement':
    'If applicable; Please provide information regarding how you will measure the positive impact your project will generate. (Tools, Metrics,etc)',
  'Budget Breakdown': 'Describe how the funds will be used',
  'Grant Timeline': 'Grant Timeline - Describe expected timeline for Grant completion',
  'How will your project drive KYOTO value?': 'How will your project drive value to Kyoto?',
  'Does your project already exist on other chains?':
    'Does your project already exist on other chains? If yes, which chains?',
  'Has your project received grants and/or VC funding from any other entity?':
    'Have you received grants and/or VC funding from any other entity? If yes, please provide details.',
  'KYOTO Wallet Address (or compatible EVM wallet address)': 'Wallet Address',
  'Additional Links': 'Please provide links to demo and any other applicable links:',
  'Other Information': 'Please provide any other information that you feel would strengthen your application:',
  Referral: 'How were you referred to this program?'
};

function getFieldName(column: string) {
  return csvColumnToQuestion[column.trim()];
}

async function getUserByEmail(email: string, spaceId: string): Promise<string> {
  let userId: string;
  email = email.toLowerCase().trim();
  if (!email) {
    throw new Error('Missing email for row: ' + email);
  }
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          googleAccounts: {
            some: {
              email
            }
          }
        },
        {
          verifiedEmails: {
            some: {
              email
            }
          }
        }
      ]
    }
  });
  if (user) {
    userId = user.id;
  } else {
    const user = await prisma.user.create({
      data: {
        username: email,
        path: uuid(),
        spaceRoles: {
          create: [
            {
              spaceId
            }
          ]
        },
        verifiedEmails: {
          create: [
            {
              email,
              name: email,
              avatarUrl: ''
            }
          ]
        }
      }
    });
    userId = user.id;
    console.log('created user for email', email, 'with id', userId);
  }
  return userId;
}

function readCSV() {
  const content = readFileSync(csvFile).toString();
  var { data: rows } = Papa.parse<string[]>(content);
  const headers = rows[0];
  return rows.slice(1, rows.length).map((values) => {
    return values.reduce<Record<string, string>>((acc, field, index) => {
      const header = headers[index];
      const fieldName = getFieldName(header);
      if (fieldName) {
        acc[fieldName] = field;
      } else if (header) {
        console.error('No field match for CSV column: ', header);
      }
      // override for testing
      if (fieldName === 'Point of contact email address' && authorEmailOverride) {
        acc[fieldName] = authorEmailOverride;
      }
      return acc;
    }, {});
  });
}

async function importCSVToSpace() {
  const rows = readCSV();
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: templateId
    },
    include: {
      proposal: {
        include: {
          evaluations: {
            include: {
              permissions: true,
              reviewers: true,
              rubricCriteria: true
            }
          },
          form: {
            include: {
              formFields: true
            }
          }
        }
      }
    }
  });
  for (const row of rows) {
    const userId = await getUserByEmail(row['Point of contact email address'], page.spaceId);
    const formAnswers = page
      .proposal!.form!.formFields!.map((field) => {
        let valueStr = (row[field.name] || '').trim() as string;

        // handle fields that combine multiple columns
        if (
          field.name === 'Name of primary point of contact' ||
          field.name === 'Please name all founders, developers and team members of this project.'
        ) {
          valueStr = row['First name'] || '';
          if (row['Last name']) {
            valueStr += ' ' + row['Last name'];
            valueStr = valueStr.trim();
          }
          if (!valueStr) {
            throw new Error('ERROR: No primary contact name for row', row);
          }
        } else if (
          field.name ===
          'Please include links to Website, Litepaper, Whitepaper or Additional Links/URL for your project or yourself.'
        ) {
          valueStr = row['Website URL'] || '';
          if (row['Litepaper/Whitepaper']) {
            valueStr += '\n' + row['Litepaper/Whitepaper'];
            valueStr = valueStr.trim();
          }
        } else if (field.name === 'Describe the goals of the grant and how the funds will be used') {
          valueStr = row['Grant Goals'] || '';
          if (row['Grant Description']) {
            valueStr += '\n\n' + row['Grant Description'];
            valueStr = valueStr.trim();
          }
        }
        if (!valueStr) {
          console.warn('No value for field:', field.name);
        }
        let value: FormFieldValue;

        // handle different types of fields
        if (field.type === 'long_text') {
          value = {
            content: {
              type: 'doc',
              content: valueStr
                .split('\n')
                .map((line) => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : undefined }))
            },
            contentText: valueStr.trim()
          };
        } else if (field.type === 'select') {
          const matchingOption = (field.options as any[])?.find(
            (option) => option.name.replace(/(\$|\,)/g, '') === valueStr.replace(/(\$|\,)/g, '')
          );
          if (!matchingOption) {
            console.log('Field options:', field.options);
            console.warn('No matching option for value "' + valueStr + '" on field ' + field.name);
            value = '';
          } else {
            value = matchingOption.id;
          }
        } else {
          value = valueStr || '';
        }

        return {
          fieldId: field.id,
          value
        };
      })
      .filter(isTruthy);
    // const result = await createProposal({
    //   userId,
    //   spaceId: page.spaceId,
    //   pageProps: {
    //     title: row['Title'],
    //     type: 'proposal',
    //     sourceTemplateId: page.id
    //   },
    //   fields: page.proposal?.fields as any,
    //   authors: [userId],
    //   evaluations: page.proposal!.evaluations as PopulatedEvaluation[],
    //   workflowId: page.proposal!.workflowId || undefined,
    //   formId: page.proposal!.form!.id,
    //   formAnswers
    // });
    console.log('Uploaded proposal for ', row['Point of contact email address']); //, { pageId: result.page.id, userId });
    //console.log('CSV Values:', row);
  }
}

// The following code is to retrieve and import the proposal from production
const templateJson = './proposal_template.json';
const importToSpaceDomain = 'binding-amaranth-manatee';

function templateQuery() {
  return prisma.page.findUniqueOrThrow({
    where: {
      id: templateId
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
}

type TemplateData = Awaited<ReturnType<typeof templateQuery>>;

async function downloadTemplate() {
  const template = await templateQuery();
  // write template to file
  writeFileSync(templateJson, JSON.stringify(template, null, 2));
}

// read file and import to local database
async function importTemplate() {
  const content = readFileSync(templateJson).toString();
  const template = JSON.parse(content) as TemplateData;
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: importToSpaceDomain
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
      data: evaluations.map((e) => ({ ...e, voteSettings: e.voteSettings as any }))
    }),
    prisma.proposalRubricCriteria.createMany({
      data: rubricCriteria.map((c) => ({ ...c, parameters: c.parameters as any }))
    }),
    prisma.formField.createMany({
      data: formFields.map((f) => ({
        ...f,
        fieldConfig: f.fieldConfig as Prisma.InputJsonValue,
        description: f.description as any,
        options: f.options as any
      }))
    })
  ]);
}

// run against production
downloadTemplate().catch((e) => console.error(e));

// run this on Dev
importTemplate().catch((e) => console.error(e));

// final step!
// importCSVToSpace().catch((e) => console.error(e));
