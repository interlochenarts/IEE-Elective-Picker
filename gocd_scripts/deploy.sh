#!/bin/bash

if [[ -z "${SFDC_CONSUMER_KEY}" ]]; then
  echo -e "Missing SFDC_CONSUMER_KEY environment variable"
fi

if [[ -z "${sfdcUser}" ]]; then
  echo -e "Missing sfdcUser environment variable"
fi

if [[ -z "${DX_ENV}" ]]; then
  echo -e "Missing DX_ENV environment variable"
fi

if [[ -z "${LOGIN_SERVER}" ]]; then
  echo -e "Missing DX_ENV environment variable"
fi

if [[ -z "${KEY_FILE}" ]]; then
  echo -e "Missing KEY_FILE environment variable"
fi

echo -e "===> SFDX Update <===\n"
sfdx update

echo -e "===> SFDX Deploy <===\n"
sfdx -v

echo -e "sfdx force:auth:jwt:grant -i${SFDC_CONSUMER_KEY} -f/home/wwadmin/certificates/${KEY_FILE} -u${sfdcUser} -a${DX_ENV} -r${LOGIN_SERVER}"
sfdx force:auth:jwt:grant -i${SFDC_CONSUMER_KEY} -f/home/wwadmin/certificates/${KEY_FILE} -u${sfdcUser} -a${DX_ENV} -r${LOGIN_SERVER}

echo -e "sfdx force:mdapi:deploy -dSalesforce/src -u${DX_ENV} -w60"
sfdx force:mdapi:deploy -dSalesforce/src -u${DX_ENV} -w60
