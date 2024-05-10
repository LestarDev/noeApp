#! /usr/bin/env node --no-warnings

var="";
data=""

for var in "$@"
do
    data=($data" $var")
done

echo ""

NODE_NO_WARNINGS=1  node server/server.mjs $data --no-warnings