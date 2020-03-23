#!/bin/bash
# Fetch the HASURA_GRAPHQL_ADMIN_SECRET from .env.test so it is used both in the docker-compose and in jest
HASURA_GRAPHQL_ADMIN_SECRET=$(cat .env.test | sed 's/#.*//g' | grep -o '^HASURA_GRAPHQL_ADMIN_SECRET.*' | xargs)
export HASURA_GRAPHQL_ADMIN_SECRET=${HASURA_GRAPHQL_ADMIN_SECRET#*=}
docker-compose -p hbp_dev -f docker-compose.yaml -f docker-compose.dev.yaml up --build -d
printf 'Waiting for Hasura Backend Plus to be ready...'
until $(curl -X GET --output /dev/null --silent --head --fail http://localhost:8080/healthz); do
    printf '.'
    sleep 1
done
echo
# Set the Hasura config.yaml file
printf 'endpoint: http://localhost:8080\nHASURA_GRAPHQL_ADMIN_SECRET: %s\n' $HASURA_GRAPHQL_ADMIN_SECRET > config.yaml
# Run the Hasura console in a detached process, that will we terminated later
# NOTE: The Hasura console should accessed from the CLI so the migration files can be automatically generated
hasura console &
console_pid=$!
# Run Jest on watch mode
docker exec -it hbp_dev_hasura-backend-plus_1 yarn test:watch
# Terminate the Hasura console
kill -TERM $console_pid
# Stop and remove all docker images, volumes and networks
docker-compose -p hbp_dev down -v --remove-orphans
