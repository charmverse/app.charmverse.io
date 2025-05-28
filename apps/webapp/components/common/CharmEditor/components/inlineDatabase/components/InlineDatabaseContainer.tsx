import { styled } from '@mui/material';

export const InlineDatabaseContainer = styled.div<{ containerWidth?: number }>`
  .BoardComponent {
    overflow: visible;
  }

  .top-head {
    padding: 0;
  }

  .BoardComponent > .container-container {
    min-width: unset;
    overflow-x: auto;
    padding: 0;
    // offset padding around document
    ${({ theme }) => theme.breakpoints.up('md')} {
      --side-margin: ${({ containerWidth }) => `calc((${containerWidth}px - 100%) / 2)`};
      margin: 0 calc(-1 * var(--side-margin));
      padding: 0 var(--side-margin);
    }
    &.sidebar-visible {
      padding-right: 0;
    }
  }

  // remove extra padding on Table view
  .Table {
    margin-top: 0;
    width: fit-content;
    min-width: 100%;
  }

  // remove extra padding on Kanban view
  .octo-board-header {
    padding-top: 0;
  }

  // remove extra margin on calendar view
  .fc .fc-toolbar.fc-header-toolbar {
    margin-top: 0;
  }

  // adjust columns on Gallery view
  @media screen and (min-width: 600px) {
    .Gallery {
      padding-right: 48px; // offset the left padding from .container-container
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-right: 80px;
      }
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .GalleryCard {
      width: auto;
    }
  }
`;
