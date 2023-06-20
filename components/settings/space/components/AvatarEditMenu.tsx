import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

type Props = {
  onUploadClick: () => void;
  onNftClick: () => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
};

export function AvatarEditMenu({ onUploadClick, onNftClick, onClose, anchorEl }: Props) {
  const isVisible = !!anchorEl;

  return (
    <Menu anchorEl={anchorEl} open={isVisible} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onUploadClick();
          onClose();
        }}
      >
        Upload image
      </MenuItem>
      <MenuItem
        onClick={() => {
          onNftClick();
          onClose();
        }}
      >
        Select image from my NFT gallery
      </MenuItem>
    </Menu>
  );
}
