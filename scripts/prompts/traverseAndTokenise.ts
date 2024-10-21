import { exec } from 'node:child_process';
import readline from 'node:readline';
import { tokenize } from '@root/lib/chatGPT/tokenize'; // Ensure this path is correct
import fs from 'fs/promises';

type FileNode = {
  name: string;
  children: FileNode[];
};

const MAX_TOKENS = 28000; // Maximum allowed tokens

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function buildFileInputPrompt({ fileContent, fileName }: { fileName: string; fileContent: string }) {
  return `------ ${fileName} --------
    
${fileContent}

------ ${fileName} --------`;
}

const basePrompt = `Please only return the content which you have changed.

The first file is the entrypoint to our code, and the rest are its dependenecies.

`;

const basePromptSize = tokenize({ text: basePrompt });

// Function to execute a command using child_process
function runDependencyCheck(file: string, callback: (data: string) => void): void {
  exec(`npx depcruise --output-type text --ts-config ./tsconfig.json ${file}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`Dependencies loaded for ${file}`);
    callback(stdout);
  });
}

// Function to parse the dependency graph
function parseDependencyGraph(input: string): Map<string, FileNode> {
  const nodes = new Map<string, FileNode>();
  input
    .trim()
    .split('\n')
    .forEach((line) => {
      const [source, target] = line.split(' → ').map((path) => path.trim());
      if (!nodes.has(source)) nodes.set(source, { name: source, children: [] });
      if (!nodes.has(target)) nodes.set(target, { name: target, children: [] });
      nodes.get(source)!.children.push(nodes.get(target)!);
    });
  return nodes;
}

// Function to tokenize file content
async function calculateFileSize(filePath: string): Promise<{ tokens: number; promptContent: string }> {
  const content = await fs.readFile(filePath, 'utf-8');

  const promptContent = buildFileInputPrompt({ fileName: filePath, fileContent: content });

  const tokens = tokenize({ text: promptContent });

  return {
    tokens,
    promptContent
  };
}

// Function to traverse the tree and tokenize files until the size limit is reached
async function traverseAndTokenize(
  node: FileNode,
  visited = new Set<FileNode>(),
  ref = { tokensRemaining: 0 }
): Promise<{ results: string[]; tokensUsed: number }> {
  if (visited.has(node) || ref.tokensRemaining <= 0) {
    return { results: [], tokensUsed: 0 };
  }

  const tokenised = await calculateFileSize(node.name);
  if (tokenised.tokens > ref.tokensRemaining) {
    return { results: [], tokensUsed: 0 };
  }

  visited.add(node);
  let results = [tokenised.promptContent];
  let tokensUsed = tokenised.tokens;
  ref.tokensRemaining -= tokenised.tokens;

  for (const child of node.children) {
    const childResult = await traverseAndTokenize(child, visited, ref);
    results = results.concat(childResult.results);
    tokensUsed += childResult.tokensUsed;
    ref.tokensRemaining -= childResult.tokensUsed;
  }

  return { results, tokensUsed };
}

// Requesting file input from the user and processing dependencies
rl.question('Enter the path to your file: ', async (file) => {
  runDependencyCheck(file, async (data) => {
    rl.close(); // Close the readline interface after processing

    const nodes = parseDependencyGraph(data);
    const rootNodes = Array.from(nodes.values()).filter(
      (node) => !Array.from(nodes.values()).some((n) => n.children.includes(node))
    );

    const tokensRemainingRef = {
      tokensRemaining: MAX_TOKENS - basePromptSize
    };

    let tokensRemaining = MAX_TOKENS;

    let fullPrompt: string = basePrompt;

    for (const root of rootNodes) {
      if (tokensRemaining <= 0) break;
      const result = await traverseAndTokenize(root, new Set<FileNode>(), tokensRemainingRef);
      fullPrompt += result.results.flat().join('\n');
      tokensRemaining -= result.tokensUsed;
    }

    console.log(`Tokens used: ${MAX_TOKENS - tokensRemaining}`);

    exec(`echo "${fullPrompt.replace(/"/g, "'")}}" | pbcopy`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log('Text copied to clipboard');
    });
  });
});
