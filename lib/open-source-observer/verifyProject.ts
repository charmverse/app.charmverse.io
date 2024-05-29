import { log } from '@charmverse/core/dist/cjs/lib/log';
import { BigQuery } from '@google-cloud/bigquery';

const parsedCredentials = JSON.parse(atob(process.env.GOOGLE_SERVICE_ACCOUNT_KEY as any));

// Initialize a BigQuery client
const bigquery = new BigQuery({
  credentials: parsedCredentials
});

const demoDataset = 'oso_playground';
const prodDataset = 'oso';

const targetDataset = `opensource-observer.${prodDataset}`;

type ProjectStats = {
  project_id: string;
  project_name: string;
  unique_addresses: number;
  date_first_transaction: {
    value: string;
  };
  days_with_onchain_activity_in_range: number;
  check_eligible_repos: boolean;
  check_unique_addresses: boolean;
  check_date_first_transaction: boolean;
  check_days_with_onchain_activity_in_range: boolean;
  meets_all_requirements: boolean;
};

// Function to run the query
async function verifyProject({
  repoOwner,
  repoName
}: {
  repoOwner: string;
  repoName: string;
}): Promise<ProjectStats | null> {
  const query = `
  with repo_stats as (
    select
      project_id,
      ARRAY_AGG(repo_name) as eligible_repos
    from (
      select
        project_id,
        CONCAT(artifact_namespace, '/', artifact_name) as repo_name
      from ${targetDataset}.rf4_repo_stats_by_project
      where artifact_namespace = '${repoOwner}' AND artifact_name = '${repoName}'
    ) sub
    group by project_id
  ),
  
  onchain_stats as (
    select
      project_id,
      project_name,
      COUNT(distinct from_artifact_name) as unique_addresses,
      MIN(bucket_day) as date_first_transaction,
      COUNT(
        distinct
        case
          when bucket_day > '2023-01-01' then bucket_day
        end
      ) as days_with_onchain_activity_in_range
    from ${targetDataset}.rf4_events_daily_to_project
    where
      event_type = 'CONTRACT_INVOCATION_SUCCESS_DAILY_COUNT'
      and bucket_day >= '2023-10-01'
      and project_id in (
        select project_id
        from repo_stats
      )
    group by
      project_id,
      project_name
  ),
  
  project_stats as (
    select
      onchain_stats.*,
      COALESCE(repo_stats.eligible_repos, ARRAY<STRING>[]) as eligible_repos
    from onchain_stats
    left join repo_stats
      on onchain_stats.project_id = repo_stats.project_id
    left join ${targetDataset}.projects_by_collection_v1 projects_by_collection_v1
      on onchain_stats.project_id = projects_by_collection_v1.project_id
    where
      projects_by_collection_v1.collection_name = 'op-onchain'
  ),
  
  checks as (
    select
      project_id,
      project_name,
      eligible_repos,
      unique_addresses,
      date_first_transaction,
      days_with_onchain_activity_in_range,
      ARRAY_LENGTH(eligible_repos) >= 1 as check_eligible_repos,
      unique_addresses >= 420 as check_unique_addresses,
      date_first_transaction < '2024-03-01' as check_date_first_transaction,
      days_with_onchain_activity_in_range >= 10 as check_days_with_onchain_activity_in_range
    from project_stats
    where project_id in (
        select project_id
        from repo_stats
      )
  )
  
  select
    project_id,
    project_name,
    unique_addresses,
    date_first_transaction,
    days_with_onchain_activity_in_range,
    check_eligible_repos,
    check_unique_addresses,
    check_date_first_transaction,
    check_days_with_onchain_activity_in_range,
    (
      check_eligible_repos
      and check_unique_addresses
      and check_date_first_transaction
      and check_days_with_onchain_activity_in_range
    ) as meets_all_requirements
  from checks;  
  `;

  const [job] = await bigquery.createQueryJob({
    query,
    location: 'US' // Location must match that of the dataset(s) referenced in the query.
  });

  log.info(`Job ${job.id} started on bigquery for repo ${repoOwner}/${repoName}`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  return rows[0] ?? null;
}

// Execute the function
// verifyProject({
//   repoOwner: '5afe',
//   repoName: 'pysha3'
// }).then(() => console.log('Query completed.'));
