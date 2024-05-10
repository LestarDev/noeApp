#! /usr/bin/bash

var="";
data=""

for var in "$@"
do
    data=($data" $var")
    echo "$var"
done

node server/server.mjs $data

echo "https://docs.google.com/spreadsheets/d/1XuCS4bhdBPXXeg_IQX3K4MZR8AHbH3FKjT03F59jYIw/edit#gid=0"