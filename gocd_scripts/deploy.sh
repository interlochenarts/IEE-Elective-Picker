#!/bin/bash

if [[ ! -z ${SFDC_TOKEN} ]]; then
  echo -e "Missing SFDC_TOKEN environment variable"
fi

if [[ ! -z ${sfdcUser} ]]; then
  echo -e "Missing sfdcUser environment variable"
fi

if [[ ! -z ${DX_ENV} ]]; then
  echo -e "Missing DX_ENV environment variable"
fi

if [[ ! -z ${LOGIN_SERVER} ]]; then
  echo -e "Missing DX_ENV environment variable"
fi

if [[ ! -z ${KEY_FILE} ]]; then
  echo -e "Missing KEY_FILE environment variable"
fi

sfdx force:auth:jwt:grant -i${SFDC_TOKEN} -f/home/wwadmin/certificates/${KEY_FILE} -u${sfdcUser} -a${DX_ENV} -rhttps://${LOGIN_SERVER}.salesforce.com
sfdx force:mdapi:deploy -dSalesforce/src -u${DX_ENV} -w60
