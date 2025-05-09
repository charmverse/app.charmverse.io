import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from 'components/common/Button';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';

import mutator from '../../mutator';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import { typeDisplayName } from '../../widgets/typeDisplayName';

type Props = {
  properties: readonly IPropertyTemplate[];
  activeView: BoardView;
  dateDisplayPropertyName?: string;
};

const ViewHeaderDisplayByMenu = React.memo((props: Props) => {
  const { properties, activeView, dateDisplayPropertyName } = props;
  const intl = useIntl();

  const createdDateName = typeDisplayName(intl, 'createdTime');

  const getDateProperties = (): IPropertyTemplate[] => {
    return properties?.filter(
      (o: IPropertyTemplate) => o.type === 'date' || o.type === 'createdTime' || o.type === 'updatedTime'
    );
  };

  return (
    <MenuWrapper>
      <Button color='secondary' size='small' variant='text'>
        <FormattedMessage
          id='ViewHeader.display-by'
          defaultMessage='Display by: {property}'
          values={{
            property: (
              <span
                style={{ color: 'rgb(var(--center-channel-color-rgb))', marginLeft: '3px', marginTop: '1px' }}
                id='displayByLabel'
              >
                {dateDisplayPropertyName || createdDateName}
              </span>
            )
          }}
        />
      </Button>
      <Menu>
        {getDateProperties().length > 0 &&
          getDateProperties().map((date: IPropertyTemplate) => (
            <Menu.Text
              key={date.id}
              id={date.id}
              name={date.name}
              rightIcon={
                activeView.fields.dateDisplayPropertyId === date.id ? <CheckOutlinedIcon fontSize='small' /> : undefined
              }
              onClick={(id) => {
                if (activeView.fields.dateDisplayPropertyId === id) {
                  return;
                }
                mutator.changeViewDateDisplayPropertyId(activeView.id, activeView.fields.dateDisplayPropertyId, id);
              }}
            />
          ))}
        {getDateProperties().length === 0 && (
          <Menu.Text
            key='createdDate'
            id='createdDate'
            name={createdDateName}
            rightIcon={<CheckOutlinedIcon fontSize='small' />}
            onClick={() => {}}
          />
        )}
      </Menu>
    </MenuWrapper>
  );
});

export default ViewHeaderDisplayByMenu;
