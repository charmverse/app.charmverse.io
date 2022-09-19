#!/bin/bash -e 

# arguments to this script is the environment namespace that the secret belongs to. 
#  This would be basically NODE_ENV. Defaults to "staging"
SECRETS_ENV=${1:-staging}
APP_STAGING_DIR="/var/app/staging/"
SECRETS_FILE="${APP_STAGING_DIR}/.env-secrets"
SECRETS_APP_NAMESPACE="/io.cv.app"
SECRETS_NAMESPACE="$SECRETS_APP_NAMESPACE/$SECRETS_ENV"

# remove previously generated secrets and fetch again
[ -f "$SECRETS_FILE" ] && rm "$SECRETS_FILE"

declare -A serets_to_lookup
serets_to_lookup=( \
    [DB_USER]="$SECRETS_NAMESPACE/db:username"   \
    [DB_PASSWD]="$SECRETS_NAMESPACE/db:password" \
    [DB_HOSTNAME]="$SECRETS_NAMESPACE/db:host"   \
    [DB_NAME]="$SECRETS_NAMESPACE/db:dbname"     \
    [AUTH_SECRET]="$SECRETS_NAMESPACE/auth_secret:auth_secret" \
    [DD_API_KEY]="$SECRETS_APP_NAMESPACE/shared/datadog/api_key:dd_api_key"   # in shared namespace
)

for env_var_name in "${!serets_to_lookup[@]}"; do 
    secret_name=${serets_to_lookup[$env_var_name]%:*}
    secret_json_keyname=${serets_to_lookup[$env_var_name]#*:}

    secret_value=$(aws secretsmanager get-secret-value         \
                                --region us-east-1             \
                                --secret-id "$secret_name"     \
                                --query "SecretString"         \
                   | jq -r --arg keyname $secret_json_keyname '. | fromjson | .[$keyname]')

    echo "$env_var_name=$secret_value" >> $SECRETS_FILE
done
