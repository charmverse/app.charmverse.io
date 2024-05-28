import { BigQuery } from '@google-cloud/bigquery';

const parsedCredentials = JSON.parse(atob(process.env.GOOGLE_SERVICE_ACCOUNT_KEY as any));

// Initialize a BigQuery client
const bigquery = new BigQuery({
  credentials: parsedCredentials
});

const demoDataset = 'oso_playground';
const prodDataset = 'oso';

const targetDataset = `opensource-observer.${demoDataset}`;

// Define your custom SQL query using sql-template-strings for syntax highlighting
const query = `
SELECT *
FROM ${targetDataset}.collections
`;

// Function to run the query
async function runQuery() {
  try {
    const [job] = await bigquery.createQueryJob({
      query,
      location: 'US' // Location must match that of the dataset(s) referenced in the query.
    });

    console.log(`Job ${job.id} started.`);

    // Wait for the query to finish
    const [rows] = await job.getQueryResults();

    console.log('Query Results:');
    rows.forEach((row) => console.log(row));
  } catch (error) {
    console.error('Error running query:', error);
  }
}

// Execute the function
runQuery().then(() => console.log('Query completed.'));
