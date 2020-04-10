#!/bin/bash
set -e
source bash-utils.sh
script_args $@

export-dotenv .env.test HASURA_GRAPHQL_ADMIN_SECRET
# Load the variables required for the Minio service
export-dotenv .env.test S3_BUCKET
export-dotenv .env.test S3_ACCESS_KEY_ID
export-dotenv .env.test S3_SECRET_ACCESS_KEY


# Create docker services
docker-compose -p hbp_test -f docker-compose.yaml -f docker-compose.test.yaml up -d $build

{ # 'try' block
    wait-for http://localhost:3000/healthz "Hasura Backend Plus"
    wait-for http://localhost:8080/healthz "Hasura Graphql Engine"
    docker exec -it hbp_test_hasura-backend-plus_1 yarn test
} || { # 'catch' block
    test_failed=true
}

# 'finally' block
# Remove docker services
docker-compose -p hbp_test down -v --remove-orphans

if [ "$test_failed" = true ] ; then
    echo 'Tests failed'
    exit 1
fi
