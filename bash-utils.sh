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
