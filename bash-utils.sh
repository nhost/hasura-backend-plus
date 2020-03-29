#!/bin/bash
export-dotenv() { # export-env <dotenv-file> <var-name> <original-var-name(optional)>
    value=$(cat $1 | sed 's/#.*//g' | grep -o "^${2}.*" | xargs)
    value=$(echo "${value#*=}")
    var_name=${2:-3}
    initial_value=$(printf '%s' "${!var_name}")
    export $(echo ${var_name})=${value:-$initial_value}
}

wait-for() { # wait-for <url> <service-name(optional)>
    printf "Waiting for the service ${2:-1} to be ready..."
    until $(curl -X GET --output /dev/null --silent --head --fail ${1}); do
        printf '.'
        sleep 1
    done
    echo
}

script_args() {
    while :; do
        case $1 in
            -h|-\?|--help)
                printf "Usage:\n\t$0 [flags]\nFlags:\n\t -b, --build\t\tForce build the docker file\n\t -h, --help\t\tShow help\n"
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
            *)
                break
        esac
        shift
    done
}
