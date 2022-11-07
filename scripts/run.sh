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

docker run -d \
  -e LOG_LEVEL=debug \
  -e HTTP_PORT=3000 \
  -e MICROSERVICE_GATEWAY_SERVICE_NAME=microservice-gateway \
  -e USERID_HEADER_KEY=userid \
  -e GROUPS_HEADER_KEY=usergroups \
  -e CLIENTTYPE_HEADER_KEY=client-type \
  -e BACKOFFICE_HEADER_KEY=isbackoffice \
  -e USER_PROPERTIES_HEADER_KEY=userproperties \
  -e RESOURCES_DIRECTORY_PATH=/usr/src/app/mocks \
  -v `pwd`/mocks:/usr/src/app/mocks \
  -p 3000:3000 \
  --name servo \
  servo
