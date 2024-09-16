import { uniq } from 'lodash';
import { upsertProposalFormAnswers } from 'lib/forms/upsertProposalFormAnswers';

import { charmValue, getProposals, findProposalMatch } from './utils';
import { getProjectsFromFile, applicationsFile, fieldIds } from './data';

async function updateProjects() {
  // Note: file path is relative to CWD
  const applications = await getProjectsFromFile(applicationsFile);
  const proposals = await getProposals();
  //console.log(applications.slice(0, 3).map((p) => p.project.repos));

  for (let application of applications) {
    const org = application.project.organization?.organization;
    if (org) {
      const match = findProposalMatch(application.project.id, proposals);
      if (!match) {
        throw new Error('No match for: ' + application.project.id);
      }
      await upsertProposalFormAnswers({
        proposalId: match.proposal!.id,
        answers: [
          {
            fieldId: fieldIds['Organization ID'],
            value: org.id
          },
          {
            fieldId: fieldIds['Organization Name'],
            value: org.name
          },
          {
            fieldId: fieldIds['Organization Description'],
            value: charmValue(org.description)
          }
        ]
      });
      console.log('Updated proposal. Path:', '/' + match.path);
    }
  }

  console.log('Done!');
}

updateProjects().catch((e) => console.error('Error crashed script', e));
