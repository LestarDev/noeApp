#! /usr/bin/env node --no-warnings

var="";
data=""

for var in "$@"
do
    data="$data $var"
done

echo ""

node data/data.mjs $data

# NODE_NO_WARNINGS=1  node data/data.mjs $data --no-warnings