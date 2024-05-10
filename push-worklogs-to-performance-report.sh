#! /usr/bin/bash

var="";
data=""

for var in "$@"
do
    data=($data" $var")
    echo "$var"
done

node server/server.mjs $data --no-warnings