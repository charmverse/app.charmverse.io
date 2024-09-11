import { uniq } from 'lodash';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';

import { charmLinks, getProposals, findProposalMatch } from './utils';
import { getProjectsFromFile, applicationsFile, fieldIds } from './data';

async function updateProjects() {
  // Note: file path is relative to CWD
  const applications = await getProjectsFromFile(applicationsFile);
  const proposals = await getProposals();
  //console.log(applications.slice(0, 3).map((p) => p.project.repos));

  for (let application of applications) {
    const reposFromJson = application.project.repos.map((repo) => repo.url).filter(Boolean);
    const reposFromWebsite = application.project.website.filter((website) => website.includes('github.com'));
    const repos = uniq(reposFromJson.concat(reposFromWebsite));
    if (repos.length) {
      const match = findProposalMatch(application.project.id, proposals);
      if (!match) {
        throw new Error('No match for: ' + application.project.id);
      }
      await upsertProposalFormAnswers({
        proposalId: match.proposal!.id,
        answers: [
          {
            fieldId: fieldIds['Github Repos'],
            value: charmLinks(repos.map((url) => ({ url })))
          }
        ]
      });
    }
  }

  console.log('Done!');
}

updateProjects().catch((e) => console.error('Error crashed script', e));
