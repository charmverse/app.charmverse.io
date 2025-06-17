import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import type { MemberProfileJson, MemberProfileName } from '@packages/profile/memberProfiles';
import Image from 'next/image';

import { Button } from 'components/common/Button';
import type { ModalProps } from 'components/common/Modal';
import Modal from 'components/common/Modal';

export function AddMoreMemberProfilesModal({
  memberProfileTypesInput,
  handleMemberProfileProperties,
  onClose,
  ...restProps
}: Omit<ModalProps, 'children'> & {
  memberProfileTypesInput: {
    isHidden: boolean;
    id: MemberProfileJson['id'];
    title: string;
  }[];
  handleMemberProfileProperties: (id: MemberProfileJson['id'], title: string) => void;
}) {
  return (
    <Modal size='large' data-test='add-profiles-modal' onClose={onClose} {...restProps}>
      <List>
        {memberProfileTypesInput
          .filter((mp) => mp.isHidden)
          .map(({ id, title }) => {
            const profileWidgetLogo = getProfileWidgetLogo(id);
            return (
              <ListItem
                key={id}
                secondaryAction={
                  <Button
                    data-test={`add-profile-button-${id}`}
                    onClick={() => handleMemberProfileProperties(id, title)}
                  >
                    Add
                  </Button>
                }
              >
                <ListItemIcon>
                  {typeof profileWidgetLogo === 'string' ? (
                    <Image width={25} height={25} alt={id} src={profileWidgetLogo} />
                  ) : (
                    profileWidgetLogo
                  )}
                </ListItemIcon>
                <ListItemText primary={title} />
              </ListItem>
            );
          })}
      </List>
    </Modal>
  );
}

export function getProfileWidgetLogo(name: MemberProfileName) {
  switch (name) {
    case 'charmverse':
      return '/images/logos/charmverse_black.png';
    case 'collection':
      return '/images/template_icons/nft_ape_icon.svg';
    case 'ens':
      return '/images/logos/ens_logo.svg';
    case 'credentials':
      return <MedalIcon />;
    default:
      return '';
  }
}
