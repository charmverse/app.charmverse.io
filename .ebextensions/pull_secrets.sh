#!/bin/bash -e 

# arguments to this script is the environment namespace that the secret belongs to. 
SECRETS_ENV=${1:-stg}
APP_STAGING_DIR="/var/app/staging/"              # this is where amazon puts app to be deployed
SECRETS_FILE="${APP_STAGING_DIR}/.env-secrets"   # What we gonna generate
SECRETS_APP_NAMESPACE="/io.cv.app"
SECRETS_NAMESPACE="$SECRETS_APP_NAMESPACE/$SECRETS_ENV"

# remove previously generated secrets and generate again
[ -f "$SECRETS_FILE" ] && rm "$SECRETS_FILE"

grep -v 
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


function install_yq {
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