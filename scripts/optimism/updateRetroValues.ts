import { prisma } from '@charmverse/core/prisma-client';

import { _, jsonDoc } from 'lib/prosemirror/builders';
import { fieldIds, spaceId, getProjectsFromFile, OPProjectData } from './retroData';

async function populateProject(raw: OPProjectData) {
  let projects = await prisma.page.findMany({
    where: {
      spaceId,
      title: raw.name,
      type: 'proposal'
    },
    include: {
      proposal: {
        include: {
          formAnswers: true
        }
      }
    }
  });
  let ignore = false;
  // handle a couple proposals with the same title
  if (raw.repos[0]?.url === 'https://github.com/HypoDropCom/hypodropcom') {
    projects = projects.filter((project) => project.path === 'page-1297952999253953');
  } else if (raw.repos[0]?.url === 'https://github.com/HypoDropCom/HypoDrop-NFT') {
    projects = projects.filter((project) => project.path === 'page-8150083804895756');
  }
  if (projects.length !== 1) {
    if (raw.name === 'Test Project') {
      ignore = true;
    } else {
      throw new Error('Project not found: ' + raw.name + ' ' + projects.length);
    }
  }
  const project = projects[0];
  const fieldId = fieldIds['OSO Slug'];

  const answer = project.proposal?.formAnswers.find((a) => a.fieldId === fieldId);

  // const validRepos = raw.repos.filter((r) => r.url && !!r.containsContracts);
  // let value = {
  //   content: validRepos.length ? jsonDoc(...validRepos.map(({ url }) => _.p(url))) : null,
  //   contentText: validRepos.map(({ url }) => url).join('\n')
  // };
  // if (!answer) {
  //   console.log(project.proposal?.formAnswers);
  //   throw new Error('Answer not found');
  // }
  ignore = true;
  let value = '';
  // const optimismFunding = raw.funding.find((f) => f.type === 'foundation-grant' || f.type === 'token-house-mission');
  // if (answer && optimismFunding) {
  //   const isNUmber = !isNaN(Number(optimismFunding.amount.trim()));
  //   if (isNUmber) {
  //     value = Number(optimismFunding.amount.trim()).toLocaleString();
  //     console.log('before', answer.value);
  //     console.log('value', value);
  //     ignore = false;
  //   }
  // }

  if (answer && raw.openSourceObserverSlug) {
    value = raw.openSourceObserverSlug;
    ignore = false;
  }
  // if (!ignore && project.proposal.status === 'published') {
  //   console.log(project);
  // }

  return { answer: answer, value, ignore };
}

async function updateFields() {
  // Note: file path is relative to CWD
  const projects = await getProjectsFromFile('./applicants.json');

  console.log('Validating', projects.length, 'projects...');

  const populatedProjects = await Promise.all(projects.map((project) => populateProject(project)));
  const validProjects = populatedProjects.filter((p) => !p.ignore);

  console.log('Processing', validProjects.length, 'projects...');

  for (const project of validProjects) {
    //console.log('processing', project.pageId, project.title);
    await prisma.formFieldAnswer.update({
      where: { id: project.answer!.id },
      data: {
        value: project.value
      }
    });

    // await prisma.formFieldAnswer.create({
    //   data: {
    //     fieldId: project.fieldId,
    //     type: 'short_text',
    //     proposalId: project.pageId,
    //     value: project.answer
    //   }
    // });
    if (validProjects.indexOf(project) % 10 === 0) {
      console.log('Processed', validProjects.indexOf(project), 'projects');
    }
  }
  console.log('Done!');
}

updateFields().catch((e) => {
  console.error('Error crashed script', e);
  process.exit(1);
});
