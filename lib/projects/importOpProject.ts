import type { ImportOpProjectPayload } from 'pages/api/projects/op/import';

import { createProject } from './createProject';

export async function importOpProject(opProject: ImportOpProjectPayload, userId: string) {
  return createProject({
    project: {
      blog: '',
      communityUrl: '',
      website: opProject.website,
      deletedAt: null,
      demoUrl: '',
      description: opProject.description,
      excerpt: '',
      github: opProject.github,
      name: opProject.name,
      otherUrl: opProject.externalLink,
      projectMembers: [
        {
          email: '',
          github: '',
          linkedin: '',
          name: '',
          otherUrl: '',
          previousProjects: '',
          telegram: '',
          twitter: '',
          walletAddress: '',
          warpcast: '',
          userId
        }
      ],
      twitter: opProject.twitter,
      walletAddress: '',
      optimismId: opProject.attestationUid
    },
    userId
  });
}
