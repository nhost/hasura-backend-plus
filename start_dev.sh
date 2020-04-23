#!/bin/bash
source bash-utils.sh
function help() {
    echo "Usage:"
    printf "\t${0} <command> [flags]\n"
    echo "Flags:"
    printf "\t-h, --help\t\tShow help\n"
    printf "\t-b, --build\t\tForce build the docker file\n"
    echo "Commands:"
    printf "\tdev\t Development without runnig any test\n"
    printf "\twatch\t Development with Jest watching\n"
    printf "\ttest\t Run Jest tests\n"
}

export NODE_ENV="test"
while :; do
    case $1 in
        -h|-\?|--help)
            help $0
            exit
            ;;
        -b|--build)
            build="--build"
            ;;
        --)
            shift
            break
            ;;
        -?*)
            printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
            ;;
        test)
            mode="test"
            export COMMAND_LINE="yarn run test"
            ;;
        dev)
            mode="dev"
            export NODE_ENV="development"
            ;;
        watch)
            mode="watch"
            # Use another internal port (4000) to run the dev server so Puppeteer Jest can use the default port (3000) in the local docker context
            export PORT=4000
            ;;
        *)
            break
    esac
    shift
done

if [ -n "$mode" ]; then
    echo "Running mode '$mode'..."
else
    help $0
    exit
fi

if [ ! -f .env.dockerdev ]; then
    echo "File .env.dockerdev not found! Creating an empty file."
    echo "Please set the secrets as per described in .env.dockerdev.example. Otherwise some tests could be skipped."
    touch .env.dockerdev
fi

# Fetch variables from .env.test so it is used in the docker-compose files
export-dotenv ".env.$NODE_ENV" HASURA_GRAPHQL_ADMIN_SECRET
export-dotenv ".env.$NODE_ENV" JWT_KEY
# Load the variables required for the Minio service
export-dotenv ".env.$NODE_ENV" S3_SECRET_ACCESS_KEY
export-dotenv ".env.$NODE_ENV" S3_ACCESS_KEY_ID

# Start docker services
docker-compose -p "hbp_${mode}" -f docker-compose.yaml -f docker-compose.dev.yaml up -d $build

trap exit_script INT
function exit_script() {
    echo "Cleaning up..."
    if [ "$mode" != "test" ]; then
        # Kill Hasura Console
        ps -ef | grep 'hasura console' | grep -v grep | awk '{print $2}' | xargs kill -9
    fi
    # Stop and remove all docker images, volumes and networks
    docker-compose -p "hbp_${mode}" down -v --remove-orphans
    exit
}

if [ "$mode" != "test" ]; then
    # NOTE: The Hasura console should accessed from the CLI so the migration files can be automatically generated
    # Waith for Hasura Graphql Engine" before starting the console
    wait-for http://localhost:8080/healthz "Hasura Graphql Engine"
    # Set the Hasura config.yaml file
    printf 'endpoint: http://localhost:8080\nHASURA_GRAPHQL_ADMIN_SECRET: %s\n' $HASURA_GRAPHQL_ADMIN_SECRET > config.yaml
    hasura console &
fi

if [ "$mode" == "watch" ]; then
    # Run Jest on watch mode
    docker exec -it -e PORT=3000 -e NODE_ENV=test "hbp_${mode}_hasura-backend-plus_1" yarn test:watch
else
    docker container logs -f "hbp_${mode}_hasura-backend-plus_1"
fi
exit_script
