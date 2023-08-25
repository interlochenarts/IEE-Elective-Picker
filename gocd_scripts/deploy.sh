#!/bin/bash

if [[ -z ${SFDC_CONSUMER_KEY} ]]; then
  echo -e "Missing SFDC_CONSUMER_KEY environment variable"
fi

if [[ -z ${sfdcUser} ]]; then
  echo -e "Missing sfdcUser environment variable"
fi

if [[ -z ${DX_ENV} ]]; then
  echo -e "Missing DX_ENV environment variable"
fi

if [[ -z ${LOGIN_SERVER} ]]; then
  echo -e "Missing LOGIN_SERVER environment variable"
fi

if [[ -z ${KEY_FILE} ]]; then
  echo -e "Missing KEY_FILE environment variable"
fi

if [[ -z ${SFDX_CLI_VERSION} ]]; then
  echo -e "Missing SFDX_CLI_VERSION environment variable"
fi

source "$HOME/.nvm/nvm.sh"
nvm install

echo -e "\n===> SFDX Update <===\n"
npm install -g @salesforce/cli@${SFDX_CLI_VERSION}
sfdx --version

echo -e "sfdx auth jwt grant --client-id=${SFDC_CONSUMER_KEY} --jwt-key-file=/home/wwadmin/certificates/${KEY_FILE} --username=${sfdcUser} --alias=${DX_ENV} --instance-url=${LOGIN_SERVER}"
sfdx auth jwt grant --client-id=${SFDC_CONSUMER_KEY} --jwt-key-file=/home/wwadmin/certificates/${KEY_FILE} --username=${sfdcUser} --alias=${DX_ENV} --instance-url=${LOGIN_SERVER}

echo -e "sfdx project deploy start --metadata-dir=Salesforce/src -alias=${DX_ENV} --wait=60"
sfdx project deploy start --metadata-dir=Salesforce/src -alias=${DX_ENV} --wait=60
