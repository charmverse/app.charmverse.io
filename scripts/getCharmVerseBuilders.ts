import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

import { getCommitsByUser } from '@packages/github/getCommitsByUser';

async function query() {
  const projects = await prisma.project.findMany({
    where: {
      github: {
        not: null
      }
    }
  });
  const haveGithub = projects.filter((p) => p.github);
  console.log(haveGithub.length, 'projects have github');
  console.log(haveGithub.slice(0, 10).map((p) => p.github));
  const projectMembers = await prisma.projectMember.findMany({
    where: {
      socialUrls: {
        isEmpty: false
      }
    }
  });
  const withGithub = projectMembers
    .map((pm) => pm.socialUrls.find((url) => url.includes('github.com')))
    .filter(Boolean);
  console.log(withGithub.length, 'out of', projectMembers.length, 'project members have github');
  console.log(withGithub.slice(0, 10).map((p) => p));
  const formFields = await prisma.formField.findMany({
    where: {
      type: 'short_text',
      name: {
        search: 'github'
      }
    },
    include: {
      answers: true
    }
  });
  console.log(formFields.length, 'form fields');
  console.log(formFields.slice(0, 10).map((p) => p.name));
  const answers = formFields.flatMap((ff) => ff.answers).filter((a) => a.value);
  console.log(answers.length, 'answers');
  console.log(answers.slice(0, 10).map((p) => p.value));
}

query();
