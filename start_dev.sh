#!/bin/bash
source bash-utils.sh
# Fetch the HASURA_GRAPHQL_ADMIN_SECRET from .env.test so it is used both in the docker-compose and in jest
export-dotenv .env.test HASURA_GRAPHQL_ADMIN_SECRET
# Load the variables required for the Minio service
export-dotenv .env.development S3_BUCKET
export-dotenv .env.development S3_ACCESS_KEY_ID
export-dotenv .env.development S3_SECRET_ACCESS_KEY

# Start docker services
docker-compose -p hbp_dev -f docker-compose.yaml -f docker-compose.dev.yaml up --build -d
wait-for http://localhost:8080/healthz "Hasura Backend Plus"
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
