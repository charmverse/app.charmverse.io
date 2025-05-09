import { prisma } from '@charmverse/core/prisma-client';
import _uniqBy from 'lodash/uniqBy';

const spaceDomain = 'op-retrofunding-review-process';

function getSunnyAttestations() {
  return prisma.optimismProjectAttestation.count({
    where: {
      projectId: {
        not: null
      },
      project: {
        source: 'sunny_awards'
      }
    }
  });
}

function getTotalNonDraftApplications() {
  return prisma.proposal.count({
    where: {
      space: {
        domain: spaceDomain
      },
      status: 'published'
    }
  });
}

function getTotaApprovedApplications() {
  return prisma.proposal.count({
    where: {
      space: {
        domain: spaceDomain
      },
      status: 'published',
      evaluations: {
        every: {
          result: 'pass'
        }
      }
    }
  });
}

async function getTotalReviewers() {
  const assignedReviewerUsers = await prisma.proposalReviewer.findMany({
    where: {
      evaluation: {
        proposal: {
          space: {
            domain: spaceDomain
          }
        },
        type: {
          in: ['feedback', 'rubric', 'pass_fail']
        }
      }
    }
  });

  const roleReviewers = assignedReviewerUsers.filter((reviewer) => !!reviewer.roleId);

  const uniqueRoleReviewers = _uniqBy(roleReviewers, 'roleId').map((reviewer) => reviewer.roleId);

  const userReviewers = assignedReviewerUsers.filter((reviewer) => !!reviewer.userId);

  const uniqueUserReviewers = _uniqBy(userReviewers, 'userId').map((reviewer) => reviewer.userId);

  const extraUserReviewers = await prisma.user.count({
    where: {
      id: {
        notIn: uniqueUserReviewers as string[]
      },
      spaceRoles: {
        some: {
          spaceRoleToRole: {
            some: {
              roleId: {
                in: uniqueRoleReviewers as string[]
              }
            }
          }
        }
      }
    }
  });

  console.log('User reviewers', uniqueUserReviewers.length);
  console.log('Extra reviewers', extraUserReviewers);

  return uniqueUserReviewers.length + extraUserReviewers;
}

async function charmCredentials() {
  return prisma.issuedCredential.findMany({
    where: {
      proposal: {
        space: {
          domain: spaceDomain
        }
      }
    }
  });
}

async function getStats() {
  const totalNonDraftApplications = await getTotalNonDraftApplications();
  const totalApprovedApplications = await getTotaApprovedApplications();
  const totalReviewers = await getTotalReviewers();
  const attestations = await getSunnyAttestations();

  const inAppCredentials = await charmCredentials();

  console.log(`Total applications: ${totalNonDraftApplications}`);
  console.log(`Total approved applications: ${totalApprovedApplications}`);
  console.log(`Total reviewers: ${totalReviewers}`);
  console.log(`Total sunny attestations: ${attestations}`);
  console.log('Total credentials issued for proposals:', inAppCredentials.length);
}

getStats().then(console.log).catch(console.error);
