import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceDir = path.resolve(__dirname, '..', '..', 'node_modules', '.prisma', 'client');
const targetDir = path.resolve(__dirname);

const copyPrismaFiles = () => {
  const sourceFile = path.resolve(sourceDir, 'libquery_engine-rhel-openssl-1.0.x.so.node');
  const targetFile = path.resolve(targetDir, 'libquery_engine-rhel-openssl-1.0.x.so.node');
  fs.copyFileSync(sourceFile, targetFile);
  // const source2File = path.join(sourceDir, 'libquery_engine-darwin-arm64.dylib.node');
  // const target2File = path.join(targetDir, 'libquery_engine-darwin-arm64.dylib.node');
  // fs.copyFileSync(source2File, target2File);

  const sourceSchema = path.join(sourceDir, 'schema.prisma');
  const targetSchema = path.join(targetDir, 'schema.prisma');
  fs.copyFileSync(sourceSchema, targetSchema);
};

copyPrismaFiles();
