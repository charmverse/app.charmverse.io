#!/bin/bash
echo -e "Please enter the file name to cruise"

read filename 

filename_clean=${filename//\//\.}

now=$(date +"%T")

if [ ! -d "depgraphs" ]; then
  echo -e "Creating depedency graph folder"
  mkdir depgraphs
fi

output_file="depgraphs/${filename_clean}.${now}.svg"

depcruise --progress -X "^node_modules"  --output-type dot --ts-config ./tsconfig.json --exclude __tests__  "${filename}" | dot -T svg > ${output_file}

echo e  "Success. Open ${output_file} to see dependencies"