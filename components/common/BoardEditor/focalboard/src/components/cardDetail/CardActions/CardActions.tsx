import { Box } from '@mui/system';
import { Board, IPropertyTemplate } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import AddBountyAction from 'components/common/BoardEditor/focalboard/src/components/cardDetail/CardActions/components/AddBountyAction';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import Menu from 'components/common/BoardEditor/focalboard/src/widgets/menu';
import MenuWrapper from 'components/common/BoardEditor/focalboard/src/widgets/menuWrapper';
import { PropertyTypes, typeDisplayName } from 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useUser } from 'hooks/useUser';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type Props = {
  pageId: string;
  readonly: boolean;
  activeView?: BoardView;
  board: Board;
};

export default function CardActions({ board, readonly, activeView, pageId }: Props) {
  const intl = useIntl();
  const [newTemplateId, setNewTemplateId] = useState('');

  useEffect(() => {
    const newProperty = board.fields.cardProperties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, board.fields.cardProperties]);

  if (readonly || !activeView) {
    return null;
  }

  return  (
      <Box display="flex">
        <div className='octo-propertyname add-property'>
          <MenuWrapper>
            <Button>
              <FormattedMessage
                id='CardDetail.add-property'
                defaultMessage='+ Add a property'
              />
            </Button>
            <Menu position='bottom-start'>
              <PropertyTypes
                label={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
                onTypeSelected={async (type) => {
                  const template: IPropertyTemplate = {
                    id: Utils.createGuid(IDType.BlockID),
                    name: typeDisplayName(intl, type),
                    type,
                    options: []
                  };
                  const templateId = await mutator.insertPropertyTemplate(board, activeView!, -1, template);
                  setNewTemplateId(templateId);
                }}
              />
            </Menu>
          </MenuWrapper>
        </div>

        <AddBountyAction readonly={readonly} cardId={pageId} />
      </Box>
    );
};
