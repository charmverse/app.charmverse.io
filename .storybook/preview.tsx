import type { Preview } from '@storybook/react';
import React from 'react';
import '../theme/styles.scss';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { IntlProvider } from 'react-intl';
import ReactDndProvider from '../components/common/ReactDndProvider';
import { LocalizationProvider } from '../components/_app/LocalizationProvider';

import '@bangle.dev/tooltip/style.css';
import 'prosemirror-menu/style/menu.css';
import 'theme/@bangle.dev/styles.scss';
import 'theme/prosemirror-tables/prosemirror-tables.scss';
import 'theme/print.scss';
import 'components/common/BoardEditor/focalboard/src/components/calculations/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/calendar/fullcalendar.scss';
import 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetail.scss';
import 'components/common/BoardEditor/focalboard/src/components/centerPanel.scss';
import 'components/common/BoardEditor/focalboard/src/components/dialog.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/gallery.scss';
import 'components/common/BoardEditor/focalboard/src/components/gallery/galleryCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculation.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/calculation/calculationOption.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanban.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanCard.scss';
import 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanColumn.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/dateRange/dateRange.scss';
import 'components/common/BoardEditor/focalboard/src/components/properties/link/link.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/calculation/calculationRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/horizontalGrip.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/table.scss';
import 'components/common/BoardEditor/focalboard/src/components/table/tableRow.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeader.scss';
import 'components/common/BoardEditor/focalboard/src/components/viewTitle.scss';
import 'components/common/BoardEditor/focalboard/src/styles/labels.scss';
import 'components/common/BoardEditor/focalboard/src/styles/_markdown.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/buttons/iconButton.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/editable.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/emojiPicker.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/label.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/colorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/labelOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/menu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/separatorOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menu/subMenuOption.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/menuWrapper.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu.scss';
import 'components/common/BoardEditor/focalboard/src/widgets/checkbox.scss';
import 'components/common/CharmEditor/components/listItemNew/czi-vars.scss';
import 'components/common/CharmEditor/components/listItemNew/czi-indent.scss';
import 'components/common/CharmEditor/components/listItemNew/czi-list.scss';
import 'theme/focalboard/focalboard.button.scss';
import 'theme/focalboard/focalboard.main.scss';
import 'react-resizable/css/styles.css';
import 'theme/styles.scss';

import { handlers } from './mockApi';
import { WagmiConfig, http, createConfig, mainnet } from 'wagmi';

// Initialize MSW - https://storybook.js.org/addons/msw-storybook-addon
initialize({
  // bypass unhandled requests (next.js hot-reloading as an example)
  onUnhandledRequest: 'bypass'
});

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#262626' },
        { name: 'light', value: '#fff' }
      ]
    },
    layout: 'fullscreen', // removes padding around the views
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    msw: { handlers }
  },
  // Provide the MSW addon loader globally
  loaders: [mswLoader]
};

export default preview;

export const globalTypes = {
  theme: {
    name: 'Theme',
    title: 'Theme',
    description: 'Theme for your components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      dynamicTitle: true,
      items: [
        { value: 'light', left: '☀️', title: 'Light mode' },
        { value: 'dark', left: '🌙', title: 'Dark mode' }
      ]
    }
  }
};

export const withMuiTheme = (Story, context) => {
  return (
    <AppThemeProvider forceTheme={context.globals.theme}>
      <Story />
    </AppThemeProvider>
  );
};

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  }
});

export const globalProviders = (Story, context) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <IntlProvider locale='en'>
        <ReactDndProvider>
          <LocalizationProvider>
            <Story />
          </LocalizationProvider>
        </ReactDndProvider>
      </IntlProvider>
    </WagmiConfig>
  );
};

export const decorators = [withMuiTheme, globalProviders];
