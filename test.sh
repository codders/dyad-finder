#!/bin/bash

set -x
set -e

ROOT_URL='https://europe-west1-dyad-finder.cloudfunctions.net/dyad'

post() {
  curl -X POST -H "Content-Type: application/json" -d"$2" ${ROOT_URL}$1 && echo ""
}

delete() {
  curl -X DELETE ${ROOT_URL}$1 && echo ""
}

get() {
  curl ${ROOT_URL}$1 && echo ""
}

# get empty group
get '/group/abc'

# create group
post '/group/abc' '{ "members": [ "Arthur", "Jenny" ]}'

# get group with members
get '/group/abc'

# set preferences for Arthur and Jenny
post '/group/abc/preference' '{ "me": "Arthur", "preferences": [ "Jenny" ] }'
post '/group/abc/preference' '{ "me": "Jenny", "preferences": [ "Arthur" ] }'

# get preference data 
get '/group/abc/raw_preferences'

# get matches
# Currently not working
get '/group/abc/matches'

# delete group
delete '/group/abc'

