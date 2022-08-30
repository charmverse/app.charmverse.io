import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { Box } from '@mui/system';
import { Stack } from '@mui/material';

export function ProposalProperties ({ readOnly }: {readOnly?: boolean}) {
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
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
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
            // excludedIds={[...selectedReviewerUsers, ...selectedReviewerRoles]}
              sx={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </Stack>
      <Stack flexDirection='row' justifyContent='space-between' gap={2} alignItems='center'>
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
            // excludedIds={[...selectedReviewerUsers, ...selectedReviewerRoles]}
              sx={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </Stack>
    </Box>
  );
}
