import fs from 'fs/promises';
import path from 'path';

import { baseUrl } from '@root/config/constants';
import puppeteer from 'puppeteer';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { PointsClaimBuilderScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimBuilderScreen';
import { PointsClaimScoutScreen } from '../components/claim/components/PointsClaimScreen/PointsClaimModal/PointsClaimScoutScreen';

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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Pre-render the component to HTML
  const component = isBuilder ? (
    <PointsClaimBuilderScreen displayName={displayName} claimedPoints={claimedPoints} repos={repos} />
  ) : (
    <PointsClaimScoutScreen displayName={displayName} claimedPoints={claimedPoints} builders={builders} />
  );

  const renderedHtml = renderToString(component);

  const html = `
    <html>
      <head>
        <style>
          @font-face {
            font-family: 'K2D';
            src: url('${baseUrl}/fonts/K2D-Regular.ttf');
          }
          @font-face {
            font-family: 'Posterama';
            src: url('${baseUrl}/fonts/Posterama-Regular.ttf');
          }
          body { margin: 0; background: url('${baseUrl}/images/claim-share-background.png'); }
        </style>
      </head>
      <body>
        <div id="root">${renderedHtml}</div>
      </body>
    </html>
  `;

  await page.setViewport({ width: 600, height: 600 });
  await page.setContent(html);

  // Wait for images and fonts to load
  await page.waitForSelector('.scoutgame-claim-screen', { visible: true });
  await page.waitForNetworkIdle();

  const screenshot = await page.screenshot();

  const fileName = `claim-screen-${Date.now()}.png`;
  const filePath = path.join(process.cwd(), 'public', 'generated', fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, screenshot);

  await browser.close();

  return fileName;
}

captureClaimScreen({ displayName: 'John Doe', claimedPoints: 100, isBuilder: true, repos: ['charmverse/charmverse'] });
