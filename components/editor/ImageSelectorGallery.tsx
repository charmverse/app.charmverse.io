import styled from '@emotion/styled';
import { grey } from '@mui/material/colors';

interface ImageSelectorGalleryProps {
  items: Record<string, string[]>
  onImageClick: (imageSrc: string) => void
}

const GalleryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const GalleryGroupName = styled.div`
  font-weight: bold;
  text-transform: uppercase;
  color: ${grey[500]};
  font-size: 14px;
`;

const GalleryGroupImages = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;
`;

export function ImageSelectorGallery (props: ImageSelectorGalleryProps) {
  const { items, onImageClick } = props;
  return (
    <div>
      {Object.entries(items).map(([groupName, images]) => (
        <GalleryGroup key={groupName}>
          <GalleryGroupName>{groupName}</GalleryGroupName>
          <GalleryGroupImages>
            {images.map(image => (
              <div key={image} role='button' tabIndex={0} onClick={() => onImageClick(image)}>
                {/* eslint-disable-next-line */}
                <img src={`/images/${image}`} width={75} height={50} alt={groupName} />
              </div>
            ))}
          </GalleryGroupImages>
        </GalleryGroup>
      ))}
    </div>
  );
}
