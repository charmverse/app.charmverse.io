import SelectProperty from 'components/common/BoardEditor/focalboard/src/components/properties/select/select';
import { BountyWithDetails } from 'models';

export default function BountyProperties (props: {readOnly?: boolean, bounty: BountyWithDetails}) {
  const { bounty, readOnly = false } = props;

  return (
    <div className='octo-propertylist CardDetailProperties'>
      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Status</div>
        <SelectProperty
          isEditable={false}
          propertyValue={bounty.status}
          propertyTemplate={{
            id: '',
            name: 'Status',
            type: 'select',
            options: [{
              color: 'propColorTeal',
              id: 'open',
              value: 'Open'
            }, {
              color: 'propColorPurple',
              id: 'suggestion',
              value: 'Suggestion'
            }, {
              color: 'propColorYellow',
              id: 'inProgress',
              value: 'In Progress'
            }, {
              color: 'propColorPink',
              id: 'complete',
              value: 'Complete'
            }, {
              color: 'propColorGray',
              id: 'paid',
              value: 'Paid'
            }]
          }}
        />
      </div>
    </div>
  );
}
