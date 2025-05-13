import { promises as fs } from 'fs';
// @ts-ignore We only call this method once in script to create the dom, no typesafety needed
import { createSVGWindow } from 'svgdom';
import { SVG, registerWindow } from '@svgdotjs/svg.js';
import { Block, Page, prisma } from '@charmverse/core/prisma-client';
import { Svg } from '@svgdotjs/svg.js';
import { BoardViewFields } from '@packages/databases/boardView';

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const childXOffset = 150;
const childYOffset = 100;

const viewColor = '#619b8a';
const boardColor = '#233D4D';
const cardColor = '#FE7F2D';

const svgWidth = 2000;
const svgHeight = 3000;

type BlockWithChildren = Block & { children?: BlockWithChildren[]; page?: Pick<Page, 'id' | 'title' | 'type'> };

type PageInfo = Pick<Page, 'id' | 'title' | 'type'>;

async function loadData(): Promise<{ blocks: BlockWithChildren[]; pageInfo: Record<string, PageInfo> }> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: 'comparable-doxxed-dragon'
    },
    select: {
      id: true
    }
  });

  const blocks = await prisma.block.findMany({
    where: {
      spaceId: space.id
    }
  });

  const pages = await prisma.page
    .findMany({
      where: {
        spaceId: space.id
      }
    })
    .then((pages) => pages.reduce((acc, page) => ({ ...acc, [page.id]: page }), {} as Record<string, PageInfo>));

  const processedBlocks = blocks
    .map((block) => ({ ...block, page: pages[block.id] }))
    // Order blocks by type
    .sort((blockA, blockB) => (String(blockA.type).charCodeAt(0) < String(blockB.type).charCodeAt(0) ? -1 : 1))
    .sort((blockA, blockB) => (blockA.page?.type.match('linked') ? -1 : 0));

  return { blocks: processedBlocks, pageInfo: pages };
}

// Recursive function to create tree
function createTree(
  blocks: Block[],
  parentId: string = '',
  pages: Record<string, PageInfo>,
  pageTitles?: string[]
): Block[] {
  return blocks
    .filter(
      (block) =>
        block.parentId === parentId &&
        // Enable filtering for blocks
        (pageTitles && block.type === 'board' ? pageTitles.includes(pages[block.id]?.title) : true)
    )
    .map((block) => ({
      ...block,
      children: createTree(blocks, block.id, pages)
    }));
}

// Recursive function to draw SVG tree
function drawTree(
  node: BlockWithChildren,
  draw: Svg,
  x: number = 0,
  y: number = 0,
  pages: Record<string, PageInfo>
): void {
  const group = draw.group();
  group.circle(10).attr({ cx: x, cy: y }); // Draw the node itself

  let textLabel = 'Block: ' + node.type;
  if (node.page) {
    textLabel += '\r\nType: ' + node.page.type + '\r\nTitle: ' + node.page.title;
  }
  if (node.type === 'view') {
    textLabel += `\r\nView: ${node.title}`;

    const sourcePageId = (node.fields as any as BoardViewFields).linkedSourceId;

    if (sourcePageId) {
      textLabel += `\r\nSourcePage: ${pages[sourcePageId]?.title}`;
    }
  }
  if (node.type === 'board' || node.type === 'view') {
    textLabel += `\r\nData:${(node.fields as any).sourceType}`;
  }

  // Add the id of the node as text with hover interaction
  const text = group.text(textLabel).move(x - childXOffset / 2, y);
  // text.attr({
  //   'onmouseover': 'evt.target.setAttribute("style", "fill: green; background: green; z-index: 1; color: red");',
  //   'onmouseout': 'evt.target.setAttribute("style", "");',
  // });

  group.attr({
    onmouseover:
      'evt.target.setAttribute("style", "fill: blue; background: blue; z-index: 1; color: red; font-size: 20px"); console.log(evt);',
    onmouseout: 'evt.target.setAttribute("style", "");'
  });

  const childY = y + childYOffset;
  node.children?.forEach((child, i) => {
    const childX = x - (((node.children?.length || 0) - 1) * childXOffset) / 2 + i * childXOffset;
    draw
      .line(x, y, childX, childY)
      .stroke({ color: child.type === 'board' ? boardColor : child.type === 'view' ? viewColor : cardColor, width: 4 }); // Draw a line to the child node
    drawTree(child, draw, childX, childY, pages); // Recursive call to draw the child nodes
  });
}

// Main async function
async function main({ pageTitles }: { pageTitles?: string[] }) {
  // Load the data
  const { blocks, pageInfo } = await loadData();

  // Create the tree from the data
  const tree = createTree(blocks, undefined, pageInfo, pageTitles);

  // Use SVG.js to draw the tree
  const draw = SVG(document.documentElement) as Svg;
  draw.viewbox(0, 0, svgWidth, svgHeight);
  draw.attr('preserveAspectRatio', 'xMidYMid meet');

  for (let i = 0; i < tree.length; i++) {
    drawTree(tree[i], draw, childXOffset, i * (childYOffset + 250), pageInfo);
  }

  let svgContent = draw.svg();
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Interactive SVG</title>
      <style>
        #container {
          position: relative;
          min-width: 500px;
          min-height: 500px;
          width: 100%;
          height: 100%;
        }
        svg {
          top: 0;
          left: 0;
          width: ${svgWidth}px;
          height: ${svgHeight}px;
        }
      </style>
    </head>
    <body>
        <div id="container">
          ${svgContent}
        </div>

        <script>
        const container = document.querySelector('#container');
        const svg = container.querySelector('svg');

        // Get the aspect ratio of the container and the SVG
        const containerAspectRatio = container.offsetWidth / container.offsetHeight;
        const svgAspectRatio = svg.viewBox.baseVal.width / svg.viewBox.baseVal.height;

        if (containerAspectRatio > svgAspectRatio) {
          // If the container is wider than the SVG (in terms of aspect ratio), adjust the width of the viewBox
          svg.viewBox.baseVal.width = svg.viewBox.baseVal.height * containerAspectRatio;
        } else {
          // If the container is taller than the SVG (in terms of aspect ratio), adjust the height of the viewBox
          svg.viewBox.baseVal.height = svg.viewBox.baseVal.width / containerAspectRatio;
        }
      </script>
    </body>
    </html>`;

  await fs.writeFile('tree-new.html', htmlContent);
}

main({ pageTitles: undefined }).catch((err) => console.error(err));
