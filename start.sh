#!/bin/bash
# source bash-utils.sh

function help() {
    echo "Usage:"
    printf "\t${0} <command> [flags]\n"
    echo "Flags:"
    printf "\t-h, --help\t\tShow help\n"
    printf "\t-r, --remove-volumes\t\Remove all volumes after shuting down\n"
    echo "Commands:"
    printf "\tdev\t Development without runnig any test\n"
    printf "\twatch\t Development with Jest watching\n"
    printf "\ttest\t Run Jest tests\n"
    exit
}

# * Get script arguments
while :; do
    case $1 in
        -h|-\?|--help)
            help $0
            ;;
        -r|--remove-volumes)
            remove="-v"
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
            remove='-v'
            ;;
        dev)
            mode="development"
            ;;
        watch)
            mode="test"
            COMMAND="yarn run test:watch"
            ;;
        *)
            break
    esac
    shift
done

# * If not mode has been given in the CLI, print help and exit
if [ -z "$mode" ]; then
    help $0
fi

# * Load variables from .env file so it is used anywhere in the docker-compose files
if [ -f .env.$mode ]
then
  export $(cat .env.$mode | sed 's/#.*//g' | xargs)
fi

await_console() {
    if [ "$mode" != "test" ]; then
        # Wait for Hasura Graphql Engine" before starting the console
        echo "Waiting for Hasura Backend Plus to be ready..."
        until $(curl -X GET --output /dev/null --silent --head --fail http://localhost:3000/healthz); do
            sleep 1
        done
        # Set the Hasura config.yaml file
        # * HBP uses config v1 so far
        # printf 'version: 2\nendpoint: http://localhost:8080\nadmin_secret: %s\nmetadata_directory: metadata'  $HASURA_GRAPHQL_ADMIN_SECRET > config.yaml
        printf 'version: 1\nendpoint: http://localhost:8080\nadmin_secret: %s\nmetadata_directory: metadata'  $HASURA_GRAPHQL_ADMIN_SECRET > config.yaml
        hasura console
    fi
}

echo "Running mode '$mode'..."

# * Build the docker images first, if the build option has been passed on
docker-compose -p "hbp_$mode" -f docker-compose.yaml -f docker-compose.$mode.yaml build

trap clean_exit INT
clean_exit() {
    echo "Cleaning up..."
    if [ "$mode" != "test" ]; then # Kill Hasura Console
        ps -ef | grep 'hasura console' | grep -v grep | awk '{print $2}' | xargs kill -9
    fi
    # Stop all docker services
    docker-compose -p "hbp_${mode}" down $remove --remove-orphans
    exit
}

# * Start on background in waiting for Hasura to be ready so the console can be launched
await_console &

# * Start docker services
docker-compose -p "hbp_$mode" -f docker-compose.yaml -f docker-compose.$mode.yaml run --service-ports --use-aliases hasura-backend-plus $COMMAND

clean_exit
