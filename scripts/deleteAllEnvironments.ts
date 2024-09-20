import { Octokit } from '@octokit/rest';

if (!process.env.GITHUB_ACCESS_TOKEN) {
  throw new Error('GITHUB_ACCESS_TOKEN is not defined in .env');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

const owner = 'charmverse'; // Replace with your GitHub username or org
const repo = 'app.charmverse.io'; // Replace with your repository name

async function deleteAllEnvironments() {
  let page = 1;
  let environmentsDeleted = 0;

  try {
    // Paginate through all environments
    while (true) {
      // Fetch a page of environments
      const { data: environments } = await octokit.repos.getAllEnvironments({
        owner,
        repo,
        per_page: 30, // Fetch 30 environments per request (maximum GitHub allows)
        page
      });

      if (environments.environments!.length === 0) {
        console.log('No more environments found.');
        break;
      }

      console.log(`Page ${page}: Found ${environments.environments!.length} environments.`);

      // Loop through each environment and delete it
      for (const environment of environments.environments!) {
        const envName = environment.name;
        console.log(`Deleting environment: ${envName}`);

        await octokit.repos.deleteAnEnvironment({
          owner,
          repo,
          environment_name: envName
        });

        console.log(`Environment ${envName} deleted.`);
        environmentsDeleted++;
      }

      page++; // Move to the next page
    }

    if (environmentsDeleted === 0) {
      console.log('No environments to delete.');
    } else {
      console.log(`${environmentsDeleted} environments deleted in total.`);
    }
  } catch (error) {
    console.error('Error deleting environments:', error);
  }
}

// Execute the function
deleteAllEnvironments();
