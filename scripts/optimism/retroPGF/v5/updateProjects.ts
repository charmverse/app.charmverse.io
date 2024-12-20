import { uniq } from 'lodash';
import { upsertProposalFormAnswers } from '@root/lib/proposals/forms/upsertProposalFormAnswers';

import { charmValue, getProposals, findProposalMatch } from './utils';
import { getProjectsFromFile, applicationsFile, fieldIds } from './data';

async function updateProjects() {
  // Note: file path is relative to CWD
  const applications = await getProjectsFromFile(applicationsFile);
  const proposals = await getProposals();
  //console.log(applications.slice(0, 3).map((p) => p.project.repos));

  for (let application of applications) {
    const attestationId = application.attestationId;
    const match = findProposalMatch(application.project.id, proposals);
    if (!match) {
      throw new Error('No match for: ' + application.project.id);
    }
    await upsertProposalFormAnswers({
      proposalId: match.proposal!.id,
      answers: [
        {
          fieldId: fieldIds['Attestation ID'],
          value: attestationId
        }
      ]
    });
    console.log('Updated proposal. Path:', '/' + match.path);
  }

  console.log('Done!');
}

updateProjects().catch((e) => console.error('Error crashed script', e));
