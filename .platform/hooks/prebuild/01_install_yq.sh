#!/bin/bash -e 

function install_yq() {
    yq_version="v4.27.5"
    yq_binary_name="yq_linux_amd64"
    # if i can't find yq in my path...i'll just install
    yq_location=$(which yq)
    if ! $?; then
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
    else 
        echo "yq already installed and is located in $yq_location"
    fi 
}

install_yq;