import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
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
              value={[]}
              disableCloseOnSelect={true}
              onChange={async (e, options) => {

              }}
              excludedIds={proposal.authors.map(author => author.userId)}
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
            <InputSearchReviewers
              disabled={readOnly}
              readOnly={readOnly}
              value={[]}
              disableCloseOnSelect={true}
              onChange={async (e, options) => {

              }}
              excludedIds={proposal.reviewers.map(reviewer => reviewer.userId)}
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
