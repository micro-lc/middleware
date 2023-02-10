#!/bin/sh

export WORKING_DIR=`pwd`/mocks

sed -i -r "s#^(RESOURCES_DIRECTORY_PATH=).*#\1$WORKING_DIR#" default.env