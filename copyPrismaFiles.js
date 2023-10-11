const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
const targetDir = path.join(__dirname, 'serverless');

const copyPrismaFiles = () => {
  const sourceFile = path.join(sourceDir, 'libquery_engine-rhel-openssl-1.0.x.so.node');
  const targetFile = path.join(targetDir, 'libquery_engine-rhel-openssl-1.0.x.so.node');
  fs.copyFileSync(sourceFile, targetFile);

  const sourceSchema = path.join(sourceDir, 'schema.prisma');
  const targetSchema = path.join(targetDir, 'schema.prisma');
  fs.copyFileSync(sourceSchema, targetSchema);
};

copyPrismaFiles();
