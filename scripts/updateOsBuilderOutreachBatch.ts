import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import path from 'path';

const inputFile = path.join(__dirname, '..', 'os-builder-outreach.csv');
const outputFile = path.join(__dirname, '..', 'os-builder-outreach-updated.csv');

const processCSV = async () => {
  const results: any[] = [];
  let updatedCount = 0;
  const targetCount = 500;

  return new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', (data) => {
        if (updatedCount < targetCount && !data.Batch) {
          data.Batch = 'os-builder-outreach-batch2';
          updatedCount++;
        }
        results.push(data);
      })
      .on('end', () => {
        console.log(`Updated ${updatedCount} rows.`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const writeCSV = async (data: any[]) => {
  const header = Object.keys(data[0]).map((key) => ({ id: key, title: key }));
  const csvWriter = createCsvWriter({
    path: outputFile,
    header: header
  });

  await csvWriter.writeRecords(data);
  console.log('CSV file has been written successfully');
};

const main = async () => {
  try {
    const updatedData = await processCSV();
    await writeCSV(updatedData as any[]);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

main();
