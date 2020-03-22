#!/bin/bash
set -e
export HASURA_GRAPHQL_ADMIN_SECRET=$(cat .env.test | sed 's/#.*//g' | grep -o '^HASURA_GRAPHQL_ADMIN_SECRET.*' | xargs)
# Create docker services
docker-compose -p hbp_test -f docker-compose.yaml -f docker-compose.test.yaml up -d

wait-for() {
    until $(curl -X GET --output /dev/null --silent --head --fail ${1}); do
        printf '.'
        sleep 1
    done
    echo
}

{ # 'try' block
    printf 'Waiting for Hasura Backend Plus to be ready...'
    wait-for http://localhost:3000/healthz
    printf 'Waiting for Hasura Graphql Engine to be ready...'
    wait-for http://localhost:8080/healthz
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