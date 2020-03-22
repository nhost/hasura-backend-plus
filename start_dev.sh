#!/bin/bash
# Fetch the HASURA_GRAPHQL_ADMIN_SECRET from .env.test so it is used both in the docker-compose and in jest
export HASURA_GRAPHQL_ADMIN_SECRET=$(cat .env.test | sed 's/#.*//g' | grep -o '^HASURA_GRAPHQL_ADMIN_SECRET.*' | xargs)
docker-compose -p hbp_dev -f docker-compose.yaml -f docker-compose.dev.yaml up --build -d
printf 'Waiting for Hasura Backend Plus to be ready...'
until $(curl -X GET --output /dev/null --silent --head --fail http://localhost:8080/healthz); do
    printf '.'
    sleep 1
done
echo
docker exec -it hbp_dev_hasura-backend-plus_1 yarn test:watch
docker-compose -p hbp_dev down -v --remove-orphans
