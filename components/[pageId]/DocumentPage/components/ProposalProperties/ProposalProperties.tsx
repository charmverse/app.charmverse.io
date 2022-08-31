import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { ProposalWithUsers } from 'lib/proposal/interface';

interface ProposalPropertiesProps {
  proposal: ProposalWithUsers,
  readOnly?: boolean
}

export default function ProposalProperties ({ proposal, readOnly }: ProposalPropertiesProps) {
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
            <InputSearchReviewers
              disabled={readOnly}
              readOnly={readOnly}
              defaultValue={proposal.authors.map(author => author.userId)}
              disableCloseOnSelect={true}
              onChange={(authorIds) => {

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
              disabled={readOnly}
              readOnly={readOnly}
              defaultValue={proposal.reviewers.map(reviewer => reviewer.userId)}
              disableCloseOnSelect={true}
              onChange={(reviewerIds) => {

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
