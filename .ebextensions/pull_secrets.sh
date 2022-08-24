#!/bin/bash -e 

# arguments to this script is the environment namespace that the secret belongs to. 
#  This would be basically NODE_ENV. Defaults to "staging"
SECRETS_ENV_NAMESPACE=${1:-staging}
APP_STAGING_DIR="/var/app/staging/"
SECRETS_FILE="${APP_STAGING_DIR}/.env-secrets"
SECRETS_APP_NAMESPACE="/io.cv.app/"

# remove previously generated secrets and fetch again
[ -f "$SECRETS_FILE" ] && rm "$SECRETS_FILE"

declare -A serets_to_lookup
serets_to_lookup=( \
    [DB_USER]     = "$SECRETS_ENV_NAMESPACE/db/username" \
    [DB_PASSWD]   = "$SECRETS_ENV_NAMESPACE/db/password" \
    [DB_HOSTNAME] = "$SECRETS_ENV_NAMESPACE/db/host"     \
    [DB_NAME]     = "$SECRETS_ENV_NAMESPACE/db/dbname"   \
    [AUTH_SECRET] = "$SECRETS_ENV_NAMESPACE/auth_secret" \
    [DD_API_KEY]  = "shared/datadog/api_key"
)

for env_var_name in "${!serets_to_lookup[@]}"; do 
    
done
echo "DD_API_KEY=$(aws secretsmanager get-secret-value \ 
                                    --secret-id "$SECRETS_APP_NAMESPACE/shared/datadog/api_key"     \
                                    --query "SecretString' | jq -r '. | fromjson | .dd_api_key")"