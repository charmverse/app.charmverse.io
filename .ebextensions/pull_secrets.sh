#!/bin/bash -e 

APP_STAGING_DIR="/var/app/staging/"
SECRETS_FILE="${APP_STAGING_DIR}/.env-secrets"
CHARMVERSE_ENV_NAMESPACE=${1:-staging}
SECRETS_APP_NAMESPACE="/io.cv.app/"

# remove previously generated secrets and fetch again
[ -f "$APP_STAGING_DIR/$SECRETS_FILE" ] && rm "$APP_STAGING_DIR/$SECRETS_FILE"

echo "DD_API_KEY=$(aws secretsmanager get-secret-value \ 
									--secret-id "$SECRETS_APP_NAMESPACE/shared/datadog/api_key" \
									--query "SecretString' | jq -r '. | fromjson | .dd_api_key")"