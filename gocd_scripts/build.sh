#!/bin/bash

NODE_VERSION=14
NG_CLI_VERSION=11.0.1

cd ..;

# check if nvm is installed. If not, install it.
if [ ! -f "$HOME/.nvm/nvm.sh" ]; then
    # May need to be updated with the latest nvm release
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
fi

# lets us use the nvm commands
source "$HOME/.nvm/nvm.sh"
nvm install $NODE_VERSION

# get our dependencies
echo -e "===> npm install <===\n"
npm install;

# check for angular-cli and install if not found
if ! command -v ng &>/dev/null; then
  echo -e "\n===> Installing @angular/cli <===\n"
  npm install -g @angular/cli@$NG_CLI_VERSION
fi

echo -e "\n===> Compiling... <===\n"
ng build --prod --aot --output-hashing=none
