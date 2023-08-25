#!/bin/bash

NG_CLI_VERSION=v13-lts

cd ..;

# check if nvm is installed. If not, install it.
if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
    # May need to be updated with the latest nvm release
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
fi

# lets us use the nvm commands
source "$HOME/.nvm/nvm.sh"
nvm install # use .nvmrc version

# get our dependencies
echo -e "===> npm install <===\n"
npm install;

# check for angular-cli and install if not found
if ! command -v ng &>/dev/null; then
  echo -e "\n===> Installing @angular/cli <===\n"
  npm install -g @angular/cli@$NG_CLI_VERSION
fi

echo -e "\n===> Compiling... <===\n"
ng build --configuration production --aot --output-hashing=none
