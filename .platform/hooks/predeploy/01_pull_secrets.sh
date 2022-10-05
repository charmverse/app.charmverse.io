#!/bin/bash -e 

# arguments to this script is the environment namespace that the secret belongs to. 
SECRETS_ENV=${1:-stg}
SECRETS_NAMESPACE="/io.cv.app/$SECRETS_ENV"
APP_STAGING_DIR="/var/app/staging"              # this is where amazon puts app to be deployed


# Only do this if there are mustash template secrets in the .env file
if grep "{{pull:secretsmanager:" $APP_STAGING_DIR/.env; then 

    # generate a new file without the mustash template holders
    grep -v "pull:secretsmanager" $APP_STAGING_DIR/.env > $APP_STAGING_DIR/.env.new

    pattern='^(.+)=.*pull:secretsmanager:(.*):SecretString:([^:]+)}}'

    # looping through secrets requested in .env file
    grep "pull:secretsmanager" $APP_STAGING_DIR/.env | while read -r line; do
        [[ $line =~ $pattern ]] && { 
            export env_var_name=${BASH_REMATCH[1]}
            secret_name=${BASH_REMATCH[2]}
            secret_json_key=${BASH_REMATCH[3]}

            export secret_value=$(aws secretsmanager get-secret-value  \
                                        --region us-east-1             \
                                        --secret-id "$secret_name"     \
                                        --query "SecretString"         \
                           | jq -r --arg keyname $secret_json_key '. | fromjson | .[$keyname]')

            [ -z "$secret_value" ] && {
                echo "$secret_name or $secret_json_key not found."
                secret_value="SECRET_NOT_FOUND"
            }
            echo "$env_var_name=\"$secret_value\"" >> .env.new
        }

    done

    bk_file_name=$(mktemp -t ._env_bk_XXXXX -p $APP_STAGING_DIR)
    mv $APP_STAGING_DIR/.env $bk_file_name
    mv $APP_STAGING_DIR/.env.new $APP_STAGING_DIR/.env

fi 
