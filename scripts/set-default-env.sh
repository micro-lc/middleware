#!/bin/bash

WORKING_DIR=`pwd`
ENV_DIR=$WORKING_DIR/.env
mkdir -p $ENV_DIR/public
mkdir -p $ENV_DIR/configurations

if [[ ! -e $ENV_DIR/config.json ]]; then
  echo '{}' > $ENV_DIR/config.json
fi

if [[ ! -e $WORKING_DIR/.env.local ]]; then
  cp default.env .env.local
  echo "PUBLIC_DIRECTORY_PATH=$ENV_DIR/public" >> $WORKING_DIR/.env.local
  echo "RESOURCES_DIRECTORY_PATH=$ENV_DIR/configurations" >> $WORKING_DIR/.env.local
  echo "SERVICE_CONFIG_PATH=$ENV_DIR/config.json" >> $WORKING_DIR/.env.local
fi
