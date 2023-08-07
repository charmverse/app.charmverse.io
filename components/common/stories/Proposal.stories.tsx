import { Paper } from '@mui/material';
import { useState } from 'react';

import { ProposalPage } from 'components/proposals/components/ProposalDialog/ProposalPage';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';

export default {
  title: 'common/Proposals',
  component: Primary
};

export function Primary() {
  const [contentUpdated, setContentUpdated] = useState(false);
  const [formInputs, setFormInputs] = useState<ProposalFormInputs>({
    authors: [],
    categoryId: null,
    content: null,
    contentText: '',
    evaluationType: 'vote',
    proposalTemplateId: null,
    reviewers: [],
    rubricCriteria: [],
    title: ''
  });

  return (
    <Paper sx={{ p: 4 }}>
      <ProposalPage
        formInputs={formInputs}
        setFormInputs={(_formInputs) => {
          setContentUpdated(true);
          setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
        }}
        contentUpdated={contentUpdated}
        setContentUpdated={setContentUpdated}
      />
    </Paper>
  );
}
