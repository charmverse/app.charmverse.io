import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import { ProposalWithUsers } from 'lib/proposal/interface';

interface ProposalPropertiesProps {
  proposal: ProposalWithUsers,
  readOnly?: boolean
}

export default function ProposalProperties ({ proposal, readOnly }: ProposalPropertiesProps) {
  const { status } = proposal;

  const canUpdateAuthors = status === 'draft' || status === 'private_draft' || status === 'discussion';
  const canUpdateReviewers = status === 'draft' || status === 'private_draft';

  return (
    <Box
      className='octo-propertylist'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
      mt={2}
    >
      <Box justifyContent='space-between' gap={2} alignItems='center'>
        <div
          className='octo-propertyrow'
          style={{
            display: 'flex',
            height: 'fit-content',
            flexGrow: 1
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly'>
            <Button>Author</Button>
          </div>
          <div style={{ width: '100%' }}>
            <InputSearchContributorMultiple
              disabled={readOnly || !canUpdateAuthors}
              readOnly={readOnly}
              defaultValue={proposal.authors.map(author => author.userId)}
              disableCloseOnSelect={true}
              onChange={(authorIds) => {
                charmClient.proposals.updateProposal(proposal.id, {
                  authors: authorIds,
                  reviewers: proposal.reviewers.map(reviewer => reviewer.userId)
                });
              }}
              sx={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </Box>
      <Box justifyContent='space-between' gap={2} alignItems='center'>
        <div
          className='octo-propertyrow'
          style={{
            display: 'flex',
            height: 'fit-content',
            flexGrow: 1
          }}
        >
          <div className='octo-propertyname octo-propertyname--readonly'>
            <Button>Reviewer</Button>
          </div>
          <div style={{ width: '100%' }}>
            <InputSearchContributorMultiple
              disabled={readOnly || !canUpdateReviewers}
              readOnly={readOnly}
              defaultValue={proposal.reviewers.map(reviewer => reviewer.userId)}
              disableCloseOnSelect={true}
              onChange={(reviewerIds) => {
                charmClient.proposals.updateProposal(proposal.id, {
                  authors: proposal.authors.map(author => author.userId),
                  reviewers: reviewerIds
                });
              }}
              sx={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </Box>
    </Box>
  );
}
