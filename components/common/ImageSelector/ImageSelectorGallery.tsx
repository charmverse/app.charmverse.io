import styled from '@emotion/styled';
import { grey } from '@mui/material/colors';

interface ImageSelectorGalleryProps {
  items: Record<string, string[]>;
  onImageClick: (imageSrc: string) => void;
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
  grid-template-columns: repeat(5, 1fr);
  grid-gap: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;
`;

const GalleryGroupImage = styled.div`
  width: 100%;
  height: 75px;

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
    border-radius: ${({ theme }) => theme.spacing(0.5)};
  }

  img:hover {
    opacity: 0.75;
  }
`;

export default function ImageSelectorGallery(props: ImageSelectorGalleryProps) {
  const { items, onImageClick } = props;
  return (
    <div>
      {Object.entries(items).map(([groupName, images]) => (
        <GalleryGroup key={groupName}>
          <GalleryGroupName>{groupName}</GalleryGroupName>
          <GalleryGroupImages>
            {images.map((image) => (
              <GalleryGroupImage key={image} role='button' tabIndex={0} onClick={() => onImageClick(image)}>
                {/* eslint-disable-next-line */}
                <img src={image} alt={groupName} />
              </GalleryGroupImage>
            ))}
          </GalleryGroupImages>
        </GalleryGroup>
      ))}
    </div>
  );
}
