#!/bin/sh

#/*
# * Copyright 2022 Mia srl
# *
# * Licensed under the Apache License, Version 2.0 (the "License");
# * you may not use this file except in compliance with the License.
# * You may obtain a copy of the License at
# *
# *     http://www.apache.org/licenses/LICENSE-2.0
# *
# * Unless required by applicable law or agreed to in writing, software
# * distributed under the License is distributed on an "AS IS" BASIS,
# * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# * See the License for the specific language governing permissions and
# * limitations under the License.
# */

docker stop middleware
docker rm middleware

docker run -d \
  -e LOG_LEVEL=debug \
  -e HTTP_PORT=3000 \
  -e MICROSERVICE_GATEWAY_SERVICE_NAME=microservice-gateway \
  -e USERID_HEADER_KEY=userid \
  -e GROUPS_HEADER_KEY=usergroups \
  -e CLIENTTYPE_HEADER_KEY=client-type \
  -e BACKOFFICE_HEADER_KEY=isbackoffice \
  -e USER_PROPERTIES_HEADER_KEY=userproperties \
  -v `pwd`/.env/public:/usr/static/public \
  -v `pwd`/.env/configurations:/usr/static/configurations \
  -v `pwd`/.env/config.json:/usr/static/config.json \
  -p 3000:3000 \
  --name middleware \
  microlc/middleware:3.0.0-rc1

# docker run -d \
#   -e LOG_LEVEL=debug \
#   -e HTTP_PORT=3000 \
#   -e MICROSERVICE_GATEWAY_SERVICE_NAME=microservice-gateway \
#   -e USERID_HEADER_KEY=userid \
#   -e GROUPS_HEADER_KEY=usergroups \
#   -e CLIENTTYPE_HEADER_KEY=client-type \
#   -e BACKOFFICE_HEADER_KEY=isbackoffice \
#   -e USER_PROPERTIES_HEADER_KEY=userproperties \
#   -e MICRO_LC_BASE_PATH=/public/ \
#   -e PUBLIC_DIRECTORY_PATH=/usr/src/app/public \
#   -e RESOURCES_DIRECTORY_PATH=/usr/src/app/configurations \
#   -v `pwd`/.env/public:/usr/src/app/public \
#   -v `pwd`/.env/configurations:/usr/src/app/configurations \
#   -v `pwd`/.env/config.json:/usr/src/app/config.json \
#   -p 3000:3000 \
#   --name middleware \
#   microlc/middleware

if command -v xclip > /dev/null
then
  echo "docker stop middleware" | xclip -sel clip
fi
