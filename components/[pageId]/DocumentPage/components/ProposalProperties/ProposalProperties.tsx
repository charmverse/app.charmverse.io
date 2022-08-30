import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';

export function ProposalProperties ({ readOnly }: {readOnly?: boolean}) {
  return (
    <div
      className='octo-propertyrow'
      style={{
        display: 'flex',
        height: 'fit-content',
        flexGrow: 1
      }}
    >
      <div className='octo-propertyname octo-propertyname--readonly' style={{ alignSelf: 'baseline', paddingTop: 12 }}>
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
  );
}
