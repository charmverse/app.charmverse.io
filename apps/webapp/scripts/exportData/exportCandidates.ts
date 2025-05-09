// @ts-nocheck
import * as _ from 'lodash';

import { writeFileSync } from 'fs';
import { stringify } from 'csv-stringify/sync';
import type { FormFieldValue, LongTextValue } from '@packages/lib/proposals/forms/interfaces';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';

const userIds: string[] = [];

const FILE_OUTPUT_PATH = './orange-dao-candidates.csv';

async function generateCSV() {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    include: {
      pages: {
        include: {
          space: {
            select: {
              name: true
            }
          },
          proposal: {
            include: {
              formAnswers: true,
              form: {
                include: {
                  formFields: true
                }
              },
              project: true
            }
          }
        }
      }
    }
  });

  console.log('Found', users.length, 'users of', userIds.length, 'requested');

  let allUsersData = [];

  for (const user of users) {
    console.log('\nUser:', user.username);
    const proposals = user.pages.filter((page) => page.proposal?.status === 'published');
    const proposalData = proposals.map((page) => {
      const answers = page.proposal?.formAnswers.reduce(
        (acc, answer) => {
          const question = page.proposal?.form?.formFields.find((field) => field.id === answer.fieldId);
          if (question) {
            const answerValue = answer.value as FormFieldValue;
            let answerStr = '';
            if (typeof (answerValue as LongTextValue).contentText === 'string') {
              answerStr = (answerValue as LongTextValue).contentText;
            } else {
              answerStr = answerValue?.toString() ?? '';
            }
            acc[`Form question: ${question.name}`] = answerStr;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      return {
        User: user.username,
        'User email': user.email,
        Proposal: page.title,
        'Proposal Date': page.createdAt.toDateString(),
        'Proposal Space': page.space.name,
        'Proposal Freeform': page.contentText,
        Project: page.proposal?.project?.name,
        'Project Description': page.proposal?.project?.description,
        'Project Excerpt': page.proposal?.project?.excerpt,
        'Project Twitter': page.proposal?.project?.twitter,
        'Project Webste': page.proposal?.project?.website,
        'Project Repo': page.proposal?.project?.github,
        'Project Demo': page.proposal?.project?.demoUrl,
        'Project Community': page.proposal?.project?.communityUrl,
        'Project Blog': page.proposal?.project?.blog,
        'Project Other URL': page.proposal?.project?.otherUrl,
        ...answers
      };
    });
    // console.table(proposalData);
    allUsersData.push(...proposalData);
  }

  const columns = _.uniq(allUsersData.flatMap((proposal) => Object.keys(proposal)));
  console.log(columns.length);
  const csvString = stringify(allUsersData, { header: true, columns });

  writeFileSync(FILE_OUTPUT_PATH, csvString);
}

generateCSV().then(() => console.log('Done'));
