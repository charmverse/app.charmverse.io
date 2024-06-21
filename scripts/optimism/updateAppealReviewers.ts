import { getCurrentEvaluation } from '@charmverse/core/dist/cjs/proposals';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from 'lib/utils/types';

const proposalConfigs = [
  {
    "path": "page-29266752524519224",
    "reviewers": ["findnemo.eth", "0x66946def4ba6153C500D743b7A5FebfC1654d6bD", "Harrysambridge@hotmail.co.uk", "Joan", "slobo.eth"]
  },
  {
    "path": "page-6508715211532261",
    "reviewers": ["op_rpgf@cheeky-gorilla.lol", "drptbl.eth", "curia-delegates.eth", "wildmolasses.eth", "luaguilar9423@gmail.com"]
  },
  {
    "path": "page-6379948214829287",
    "reviewers": ["Rahul.kothari.201@gmail.com", "toph@tutamail.com", "ethzoomer@gmail.com", "launamu", "findnemo.eth"]
  },
  {
    "path": "page-31605145424179204",
    "reviewers": ["Joan", "Harrysambridge@hotmail.co.uk", "Tamarandom.eth", "slobo.eth", "0x66946def4ba6153C500D743b7A5FebfC1654d6bD"]
  },
  {
    "path": "page-7209896009770029",
    "reviewers": ["drptbl.eth", "curia-delegates.eth", "wildmolasses.eth", "luaguilar9423@gmail.com", "Rahul.kothari.201@gmail.com"]
  },
  {
    "path": "page-2865729485828672",
    "reviewers": ["toph@tutamail.com", "ethzoomer@gmail.com", "launamu", "findnemo.eth", "op_rpgf@cheeky-gorilla.lol"]
  },
  {
    "path": "page-9088363309209739",
    "reviewers": ["Joan", "Harrysambridge@hotmail.co.uk", "Tamarandom.eth", "slobo.eth", "0x66946def4ba6153C500D743b7A5FebfC1654d6bD"]
  },
  {
    "path": "page-9158366044362709",
    "reviewers": ["drptbl.eth", "curia-delegates.eth", "wildmolasses.eth", "luaguilar9423@gmail.com", "Rahul.kothari.201@gmail.com"]
  },
  {
    "path": "page-06919794816127012",
    "reviewers": ["toph@tutamail.com", "ethzoomer@gmail.com", "launamu", "op_rpgf@cheeky-gorilla.lol", "Harrysambridge@hotmail.co.uk"]
  },
  {
    "path": "page-4380273110833599",
    "reviewers": ["Joan", "Tamarandom.eth", "slobo.eth", "0x66946def4ba6153C500D743b7A5FebfC1654d6bD", "drptbl.eth"]
  },
  {
    "path": "page-884451996747732",
    "reviewers": ["curia-delegates.eth", "wildmolasses.eth", "Rahul.kothari.201@gmail.com", "ethzoomer@gmail.com"]
  },
  {
    "path": "page-5537398591228462",
    "reviewers": ["findnemo.eth", "op_rpgf@cheeky-gorilla.lol", "Joan", "Harrysambridge@hotmail.co.uk"]
  },
  {
    "path": "page-6734421700238933",
    "reviewers": ["slobo.eth", "0x66946def4ba6153C500D743b7A5FebfC1654d6bD", "drptbl.eth", "curia-delegates.eth", "wildmolasses.eth"]
  }
]

export async function updateAppealReviewers() {
  const totalProposals = proposalConfigs.length;
  let updatedProposals = 0;
  for (const proposalConfig of proposalConfigs) {
    try {
      const proposal = await prisma.proposal.findFirstOrThrow({
        where: {
          page: {
            path: proposalConfig.path
          }
        },
        select: {
          id: true,
          evaluations: {
            orderBy: {
              index: "asc"
            }
          }
        }
      });
  
      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      if (currentEvaluation?.appealable && currentEvaluation.appealedAt) {
        const reviewers = (await Promise.all(proposalConfig.reviewers.map(reviewer => prisma.user.findFirst({
          where: {
            OR: [
              {
                username: reviewer.toLowerCase()
              },
              {
                wallets: {
                  some: {
                    address: reviewer.toLowerCase()
                  }
                }
              },
              {
                wallets: {
                  some: {
                    ensname: reviewer.toLowerCase()
                  }
                }
              },
              {
                verifiedEmails: {
                  some: {
                    email: reviewer.toLowerCase()
                  }
                }
              },
            ]
          }
        })))).filter(isTruthy);

        await prisma.$transaction([
          prisma.proposalAppealReviewer.deleteMany({
            where: {
              proposalId: proposal.id,
              evaluationId: currentEvaluation.id
            }
          }),
          prisma.proposalAppealReviewer.createMany({
            data: reviewers.map(reviewer => ({
              evaluationId: currentEvaluation.id,
              userId: reviewer.id,
              proposalId: proposal.id,
            }))
          })
        ])
      }
    } catch (error) {
      console.error(error);
    } finally {
      updatedProposals++;
      console.log(`Updated ${updatedProposals}/${totalProposals} proposal appeal reviewers`);
    }
  }
}

updateAppealReviewers();