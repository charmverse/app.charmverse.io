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
      // throw new Error('Project not found: ' + raw.name + ' ' + projects.length);
      //    console.error('Project not found: ' + raw.name + ' ' + projects.length);
      return { answer: null, proposalId: null, fieldId: null, ignore: true };
    }
  }
  const project = projects[0];
  const fieldId = fieldIds['Grant Details'];

  const existingAnswer = project.proposal?.formAnswers.find((a) => a.fieldId === fieldId);

  // ignore = true;
  // if (project.path === 'page-11078911140653469') {
  //   ignore = false;
  // }

  const optimismFunding = raw.funding.find((f) => f.type === 'foundation-mission');
  const answer = null;
  if (optimismFunding) {
    console.log(project.id, ' : ', project.title);
  }
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

  // if (!ignore && project.proposal.status === 'published') {
  //   console.log(project);
  // }

  return { answerId: existingAnswer?.id, answer: answer, proposalId: project.proposalId!, fieldId, ignore };
}

async function updateFields() {
  // Note: file path is relative to CWD
  const projects = await getProjectsFromFile('../optimism-data/applicants.json');

  console.log('Validating', projects.length, 'projects...');

  const populatedProjects = await Promise.all(projects.map((project) => populateProject(project)));
  const validProjects = populatedProjects.filter((p) => !p.ignore);
  return;
  console.log('Processing', validProjects.length, 'projects...');

  for (const project of validProjects) {
    //console.log('processing', project.pageId, project.title);
    // await prisma.formFieldAnswer.update({
    //   where: { id: project.answerId },
    //   data: {
    //     value: project.answer!
    //   }
    // });

    // if (!project.answerId) {
    //   await prisma.formFieldAnswer.create({
    //     data: {
    //       fieldId: project.fieldId!,
    //       type: 'long_text',
    //       proposalId: project.proposalId!,
    //       value: project.answer!
    //     }
    //   });
    // }
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
