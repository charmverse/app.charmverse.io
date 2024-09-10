import type { Preview } from '@storybook/react';
import React from 'react';
import '../theme/styles.scss';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { IntlProvider } from 'react-intl';
import ReactDndProvider from '../components/common/ReactDndProvider';
import { LocalizationProvider } from '../components/_app/LocalizationProvider';

import 'prosemirror-menu/style/menu.css';
import 'theme/@bangle.dev/styles.scss';
import 'theme/prosemirror-tables/prosemirror-tables.scss';
import 'theme/print.scss';
import 'components/common/DatabaseEditor/components/calculations/calculation.scss';
import 'components/common/DatabaseEditor/components/calendar/fullcalendar.scss';
import 'components/common/DatabaseEditor/components/cardDetail/cardDetail.scss';
import 'components/common/DatabaseEditor/components/centerPanel.scss';
import 'components/common/DatabaseEditor/components/dialog.scss';
import 'components/common/DatabaseEditor/components/gallery/gallery.scss';
import 'components/common/DatabaseEditor/components/gallery/galleryCard.scss';
import 'components/common/DatabaseEditor/components/kanban/calculation/calculation.scss';
import 'components/common/DatabaseEditor/components/kanban/calculation/calculationOption.scss';
import 'components/common/DatabaseEditor/components/kanban/kanban.scss';
import 'components/common/DatabaseEditor/components/kanban/kanbanCard.scss';
import 'components/common/DatabaseEditor/components/kanban/kanbanColumn.scss';
import 'components/common/DatabaseEditor/components/properties/dateRange/dateRange.scss';
import 'components/common/DatabaseEditor/components/properties/link/link.scss';
import 'components/common/DatabaseEditor/components/table/calculation/calculationRow.scss';
import 'components/common/DatabaseEditor/components/table/horizontalGrip.scss';
import 'components/common/DatabaseEditor/components/table/table.scss';
import 'components/common/DatabaseEditor/components/table/tableRow.scss';
import 'components/common/DatabaseEditor/components/viewHeader/viewHeader.scss';
import 'components/common/DatabaseEditor/components/viewTitle.scss';
import 'components/common/DatabaseEditor/styles/labels.scss';
import 'components/common/DatabaseEditor/styles/_markdown.scss';
import 'components/common/DatabaseEditor/widgets/buttons/iconButton.scss';
import 'components/common/DatabaseEditor/widgets/editable.scss';
import 'components/common/DatabaseEditor/widgets/emojiPicker.scss';
import 'components/common/DatabaseEditor/widgets/label.scss';
import 'components/common/DatabaseEditor/widgets/menu/colorOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/labelOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/menu.scss';
import 'components/common/DatabaseEditor/widgets/menu/separatorOption.scss';
import 'components/common/DatabaseEditor/widgets/menu/subMenuOption.scss';
import 'components/common/DatabaseEditor/widgets/menuWrapper.scss';
import 'components/common/DatabaseEditor/widgets/propertyMenu.scss';
import 'components/common/DatabaseEditor/widgets/checkbox.scss';
import 'packages/charmeditor/src/extensions/listItem/czi-indent.module.scss';
import 'packages/charmeditor/src/extensions/listItem/czi-list.module.scss';
import 'packages/charmeditor/src/extensions/listItem/czi-vars.module.scss';
import 'theme/databases/databases.button.scss';
import 'theme/databases/databases.main.scss';
import 'react-resizable/css/styles.css';
import 'theme/styles.scss';

// Prosemirror tables
import 'components/common/CharmEditor/components/table/ui/czi-table-grid-size-editor.css';
import 'components/common/CharmEditor/components/table/ui/czi-color-editor.css';

import { handlers } from './mockApi';
import { mainnet } from 'viem/chains';
import { WagmiConfig, http, createConfig } from 'wagmi';

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
    // actions: { argTypesRegex: '^on[A-Z].*' }, config from storybook 7
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
