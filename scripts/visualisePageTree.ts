import { promises as fs } from 'fs';
import { createSVGWindow } from 'svgdom';
import { SVG, registerWindow } from '@svgdotjs/svg.js';
import { Block, Page, prisma } from '@charmverse/core/prisma-client';

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);


type BlockWithChildren = Block & {children?: BlockWithChildren[], page?: Pick<Page, 'id' | 'title' | 'type'>};

async function loadData(): Promise<BlockWithChildren[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: 'blocks-space'
    },
    select: {
      id: true
    }
  })

  const blocks = await prisma.block.findMany({
    where: {
      spaceId: space.id
    }
  })

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: blocks.map(block => block.id)
      }
    }
  }).then(pages => pages.reduce((acc, page) => ({ ...acc, [page.id]: page }), {} as Record<string, Pick<Page, 'id' | 'title' | 'type'>>));

  return blocks.map(block => ({ ...block, page: pages[block.id] }));
}

// Recursive function to create tree
function createTree(blocks: Block[], parentId: string = ''): Block[] {
  return blocks
    .filter(block => block.parentId === parentId)
    .map(block => ({ 
      ...block, 
      children: createTree(blocks, block.id) 
    }));
}

// Recursive function to draw SVG tree
function drawTree(node: BlockWithChildren, draw: any, x: number = 0, y: number = 0): void {
  const group = draw.group();
  group.circle(10).attr({ cx: x, cy: y }); // Draw the node itself
  group.text((node.page ? `Page: ${node.page.type} // ${node.page.title}\r\n` : '') + `Block: ${node.type}`).move(x, y); // Add the id of the node as text

  const childY = y + 50;
  node.children?.forEach((child, i) => {
    const childX = x - ((node.children?.length || 0) - 1) * 30 / 2 + i * 30;
    draw.line(x, y, childX, childY).stroke({ color: '#f06', width: 2 }); // Draw a line to the child node
    drawTree(child, draw, childX, childY); // Recursive call to draw the child nodes
  });
}

// Main async function
async function main() {
  // Load the data
  const blocks = await loadData();

  // Create the tree from the data
  const tree = createTree(blocks);

  // Use SVG.js to draw the tree
  const draw = SVG(document.documentElement);
  draw.viewbox(0, 0, 500, 500);

  for(let i = 0; i < tree.length; i++) {
    drawTree(tree[i], draw, i * 100, 50);
  }

  // Write the SVG to a file
  await fs.writeFile('tree.svg', draw.svg());
}

main().catch(err => console.error(err));
