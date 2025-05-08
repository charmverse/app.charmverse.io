import { prisma } from '@charmverse/core/prisma-client';

import { _, jsonDoc } from '@packages/bangleeditor/builders';
import { fieldIds, spaceId, getProjectsFromFile, OPProjectData, getCsvData } from './retroPGF/v4/data';

const repoData = getCsvData<{ ProjectID: string; Repo: string }>('../optimism-data/repo_updates.csv');

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
  let ignore = true;
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
  const fieldId = fieldIds['Github Repo'];

  const existingAnswer = project.proposal?.formAnswers.find((a) => a.fieldId === fieldId);
  if (!existingAnswer) {
    console.log('no answer');
  }
  const rawValue = repoData.find((r) => r.ProjectID === raw.id);
  if (rawValue) {
    ignore = false;
  }
  const repos: string[] = rawValue ? JSON.parse(rawValue.Repo.replaceAll("'", '"')) : [];
  // ignore = true;
  // if (project.path === 'page-11078911140653469') {
  //   ignore = false;
  // }

  const answer = {
    content: repos.length ? jsonDoc(...repos.map((url) => _.p(_.link({ href: url }, url)))) : null,
    contentText: repos.map((url) => url).join('\n')
  };
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

  console.log('Processing', validProjects.length, 'projects...');

  for (const project of validProjects) {
    console.log('processing', project.proposalId);
    await prisma.formFieldAnswer.update({
      where: { id: project.answerId },
      data: {
        value: project.answer!
      }
    });

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
