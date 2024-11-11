import fs from 'fs/promises';
import path from 'path';

import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { baseUrl } from '@root/config/constants';
import puppeteer from 'puppeteer';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { PointsClaimBuilderScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';
import { serverTheme } from '../theme/serverTheme';

type CaptureClaimScreenProps = {
  displayName: string;
  claimedPoints: number;
  // For builder screen
  repos?: string[];
  // For scout screen
  builders?: { avatar: string | null; displayName: string }[];
  isBuilder: boolean;
};

export async function captureClaimScreen({
  displayName,
  claimedPoints,
  repos = [],
  builders = [],
  isBuilder
}: CaptureClaimScreenProps) {
  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);
  const component = (
    <ThemeProvider theme={serverTheme}>
      <CssBaseline />
      {isBuilder ? (
        <PointsClaimBuilderScreen displayName={displayName} claimedPoints={claimedPoints} repos={repos} />
      ) : (
        <PointsClaimScoutScreen displayName={displayName} claimedPoints={claimedPoints} builders={builders} />
      )}
    </ThemeProvider>
  );

  const renderedHtml = renderToString(component);
  const emotionChunks = extractCriticalToChunks(renderedHtml);
  const emotionCss = constructStyleTagsFromChunks(emotionChunks);

  const html = `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'Posterama';
            src: url('${baseUrl}/fonts/Posterama-Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
          }

          @font-face {
            font-family: 'K2D';
            src: url('${baseUrl}/fonts/K2D-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }
          
          body {
            margin: 0;
          }
        </style>
        ${emotionCss}
      </head>
      <body>
        <div id="root">
          <img src="${baseUrl}/images/claim-share-background.png" alt="Claim share background" width="600" height="600" style="position: absolute; top: 0; left: 0;" />
          ${renderedHtml}
        </div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 600 });
  await page.setContent(html);

  // Wait for images and fonts to load
  await page.waitForSelector('.scoutgame-claim-screen', { visible: true });
  await page.waitForNetworkIdle();

  const screenshot = await page.screenshot();

  const fileName = `claim-screen.png`;
  const filePath = path.join(process.cwd(), 'public', 'generated', fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, screenshot);

  await browser.close();

  return fileName;
}

captureClaimScreen({
  displayName: 'John Doe 🎩🍌 ⏩',
  claimedPoints: 100,
  isBuilder: true,
  repos: ['charmverse/charmverse']
});
