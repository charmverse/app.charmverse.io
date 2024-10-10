// Function to fetch repos for a given owner

export type GitHubAPIRepo = {
  id: number;
  default_branch: string;
  full_name: string;
  html_url: string;
  name: string;
  fork: boolean;
  owner: { login: string; type: string };
};

export async function getReposByOwner(owner: string) {
  let allRepos: GitHubAPIRepo[] = [];
  let page = 1;
  const perPage = 100; // GitHub's max per page
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await fetch(`https://api.github.com/users/${owner}/repos?page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const repos = await response.json();
    allRepos = allRepos.concat(repos);

    // Check if there's a next page
    const linkHeader = response.headers.get('Link');
    hasNextPage = !!linkHeader && linkHeader.includes('rel="next"');
    page += 1;

    // Add a small delay to avoid hitting rate limits
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  return allRepos;
}
