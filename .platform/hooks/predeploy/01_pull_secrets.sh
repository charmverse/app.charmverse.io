#!/bin/bash -e 

# arguments to this script is the environment namespace that the secret belongs to. 
# SECRETS_ENV=${1:-stg}
# SECRETS_NAMESPACE="/io.cv.app/$SECRETS_ENV"
APP_STAGING_DIR="/var/app/staging"              # this is where amazon puts app to be deployed

! env_file_grep=$(grep "EBSTALK_ENV_FILE" $APP_STAGING_DIR/.env) && {
    echo "No EBSTALK_ENV_FILE to process, exiting $0"
    exit 0
}

if [[ $env_file_grep =~ ^EBSTALK_ENV_FILE=(.+)$ ]]; then
    ebstalk_env_file="$APP_STAGING_DIR/.ebstalk.apps.env/${BASH_REMATCH[1]}"

    ! [ -f "$ebstalk_env_file" ] && {
        echo "Cannot find and process env file $ebstalk_env_file"
        exit 1
    }

    # back up the .env file first
    bk_file_name=$(mktemp -t ._env_bk_XXXXX -p $APP_STAGING_DIR)
    cp $APP_STAGING_DIR/.env $bk_file_name

    # before we process the secrets, 
    # lets get any non-secret env variables from ebstalk_env_file and append it to the $APP_STAGING_DIR/.env file
    grep -v -e "^\s*$" -e "^#" -e "pull:secretsmanager" $ebstalk_env_file >> $APP_STAGING_DIR/.env

    # Now start processing secrets
    secrets_pattern='^(.+)=.*pull:secretsmanager:(.*):SecretString:([^:]+):?(.*)}}'
    # looping through secrets requested in .env file
    grep "pull:secretsmanager" $ebstalk_env_file | while read -r line; do
        [[ $line =~ $secrets_pattern ]] && { 
            export env_var_name=${BASH_REMATCH[1]}
            secret_name=${BASH_REMATCH[2]}
            secret_json_key=${BASH_REMATCH[3]}
            secret_version=${BASH_REMATCH[4]:-AWSCURRENT}

            if [[ $secret_version =~ ^AWS ]]; then 
                secret_version_option=(--version-stage "$secret_version")
            else
                secret_version_option=(--version-id "$secret_version")
            fi

            secret_value=$(aws secretsmanager get-secret-value     \
                                    --region us-east-1             \
                                    --secret-id "$secret_name"     \
                                    --query "SecretString"         \
                                    "${secret_version_option[@]}"  \
                       | jq -r --arg keyname $secret_json_key '. | fromjson | .[$keyname]')

            [ -z "$secret_value" ] && {
                echo "$secret_name or $secret_json_key not found."
                secret_value="SECRET_NOT_FOUND"
            }
            echo "$env_var_name=\"$secret_value\"" >> $APP_STAGING_DIR/.env
        }

    done

fi
