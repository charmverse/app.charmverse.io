import { prisma } from '@charmverse/core/prisma-client';
import { stringToValidPath } from 'lib/utils/strings';

async function createPathForConnectProjects() {
  const projects = await prisma.project.findMany({
    where: {
      source: 'connect'
    },
    select: {
      id: true,
      name: true
    }
  });

  const processedProjectNames: Set<string> = new Set();
  const totalProjects = projects.length;
  let countProjects = 0;

  for (const project of projects) {
    try {
      const processesName = processedProjectNames.has(project.name);
      let path = '';
      const nameToPath = stringToValidPath({ input: project.name, wordSeparator: '-', autoReplaceEmpty: false });
      if (processesName) {
        path = `${nameToPath}-${Math.random().toString().replace('0.', '')}`;
      } else {
        path = nameToPath;
      }

      await prisma.project.update({
        where: {
          id: project.id
        },
        data: {
          path
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      countProjects++;
      processedProjectNames.add(project.name);
      console.log(`Progress: ${countProjects}/${totalProjects}`);
    }
  }
}

createPathForConnectProjects().then(() => console.log('Done'));
