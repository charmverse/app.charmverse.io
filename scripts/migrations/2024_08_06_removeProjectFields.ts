// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

import * as fs from 'fs';
import { isTruthy } from '@packages/lib/utils/types';

/**
 * Create a back up of projects and also clean up some fields
 */

async function query() {
  const projects = await prisma.project.findMany({
    include: {
      projectMembers: true
    }
  });
  for (const project of projects) {
    const teamMemberUpdates = project.projectMembers.map((member) => {
      const socialUrls = [
        member.linkedin,
        member.otherUrl,
        member.previousProjects,
        member.telegram,
        member.twitter,
        member.warpcast
      ].filter(isTruthy);
      return prisma.projectMember.update({
        where: {
          id: member.id
        },
        data: {
          socialUrls
        }
      });
    });
    const websites = project.websites.length
      ? project.websites
      : [
          project.website,
          project.blog,
          project.mirror ? 'https://mirror.xyz/' + project.mirror : undefined,
          project.otherUrl,
          project.communityUrl,
          project.demoUrl
        ].filter(isTruthy);
    await prisma.$transaction([
      prisma.project.update({
        where: {
          id: project.id
        },
        data: {
          description: project.excerpt,
          websites
        }
      }),
      ...teamMemberUpdates
    ]);
  }
}

async function download() {
  const projects = await prisma.project.findMany({
    include: {
      projectMembers: true
    }
  });
  const data = JSON.stringify(projects, null, 2);
  // write json to file on disk
  fs.writeFileSync('cv_projects_backup.json', data);
  console.log('Data written to file');
}

// query();

download();
