import SelectProperty from 'components/common/BoardEditor/focalboard/src/components/properties/select/select';
import Editable from 'components/common/BoardEditor/focalboard/src/widgets/editable';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import { RPCList } from 'connectors';
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

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Chain</div>
        <SelectProperty
          isEditable={false}
          propertyValue={bounty.chainId.toString()}
          propertyTemplate={{
            id: '',
            name: 'Chain',
            type: 'select',
            options: RPCList.map(rpc => ({
              color: 'propColorGray',
              id: rpc.chainId.toString(),
              value: rpc.chainName
            }))
          }}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Token</div>
        <SelectProperty
          isEditable={false}
          propertyValue={bounty.rewardToken.toString()}
          propertyTemplate={{
            id: '',
            name: 'Chain',
            type: 'select',
            options: [{
              color: 'propColorGray',
              id: 'ETH',
              value: 'ETH'
            }]
          }}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Amount</div>
        <Editable
          className='octo-propertyvalue'
          placeholderText=''
          value={bounty.rewardAmount.toString()}
          autoExpand={false}
          onChange={() => {}}
          onSave={() => {
          }}
          onCancel={() => {}}
          validator={(newValue) => true}
          spellCheck={false}
          readonly={readOnly}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Applications</div>
        <Switch
          isOn={Boolean(bounty.approveSubmitters)}
          onChanged={() => {}}
          readOnly={readOnly}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Submission Limit</div>
        <Editable
          className='octo-propertyvalue'
          placeholderText=''
          value={bounty.maxSubmissions?.toString() ?? '0'}
          autoExpand={false}
          onChange={() => {}}
          onSave={() => {
          }}
          onCancel={() => {}}
          validator={(newValue) => true}
          spellCheck={false}
          readonly={readOnly}
        />
      </div>

    </div>
  );
}
