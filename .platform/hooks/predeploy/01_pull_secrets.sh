#!/bin/bash -e 

function install_yq() {
    yq_version="v4.27.5"
    yq_binary_name="yq_linux_amd64"
    # if i can't find yq in my path...i'll just install
    if ! which yq; then
        echo "No prior yq cmd installed, download and installing now..."
        tmp_dir=$(mktemp -d -t yqXXX)
        wget -q -P $tmp_dir -B "https://github.com/mikefarah/yq/releases/download/$yq_version/$yq_binary_name" \
             -i - <<FILES
checksums_hashes_order
extract-checksum.sh
checksums
yq_linux_amd64
FILES
        
        cd $tmp_dir
        chmod u+x ./extract-checksum.sh
        checksum_status=$(./extract-checksum.sh MD5 $yq_binary_name | awk '{ print $2 " " $1}' | md5sum -c -)
        [[ $checksum_status =~ OK ]] && {
            mv $tmp_dir/$yq_binary_name /usr/local/bin/yq    # should I move it to /root/bin ?
            chmod 755 /usr/local/bin/yq
            chown root:root /usr/local/bin/yq
        }
        rm -fr $tmp_dir
    fi
    which yq
}


# install yq first
install_yq;

# arguments to this script is the environment namespace that the secret belongs to. 
SECRETS_ENV=${1:-stg}
SECRETS_NAMESPACE="/io.cv.app/$SECRETS_ENV"
APP_STAGING_DIR="/var/app/staging"              # this is where amazon puts app to be deployed


# Only do this if there are mustash template secrets in the .env file
if grep "{{pull:secretsmanager:" $APP_STAGING_DIR/.env; then 

    # generate a new file without the mustash template holders
    grep -v "pull:secretsmanager" $APP_STAGING_DIR/.env > $APP_STAGING_DIR/.env.new

    pattern='^(.+)=.*pull:secretsmanager:(.*):SecretString:([^:]+)}}'
    grep "pull:secretsmanager" $APP_STAGING_DIR/.env | while read -r line; do
    #grep "pull:secretsmanager" 00_env_vars.config | while read -r line; do
        [[ $line =~ $pattern ]] && { 
            export env_var_name=${BASH_REMATCH[1]}
            secret_name=${BASH_REMATCH[2]}
            secret_json_key=${BASH_REMATCH[3]}

            export secret_value=$(aws secretsmanager get-secret-value         \
                                        --region us-east-1             \
                                        --secret-id "$secret_name"     \
                                        --query "SecretString"         \
                           | jq -r --arg keyname $secret_json_key '. | fromjson | .[$keyname]')

            echo "$env_var_name=\"$secret_value\"" >> .env.new
            # yq -I 4 -i 'with(.option_settings."aws:elasticbeanstalk:application:environment";
            #               .[env(env_var_name)] = env(secret_value) | . style="double" )
            #            ' $APP_STAGING_DIR/.env.new
        }

    done

    bk_file_name=$(mktemp -t ._env_bk_XXXXX -p $APP_STAGING_DIR)
    mv $APP_STAGING_DIR/.env $bk_file_name
    mv $APP_STAGING_DIR/.env.new $APP_STAGING_DIR/.env

fi 
