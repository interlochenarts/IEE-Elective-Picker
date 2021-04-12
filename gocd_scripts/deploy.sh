#!/bin/bash

sfdx force:auth:jwt:grant -i${SFDC_TOKEN} -f/home/wwadmin/certificates/server.key -u${sfdcUser} -a${SFDX_ENV} -rhttps://${LOGIN_SERVER}.salesforce.com
sfdx force:mdapi:deploy -dSalesforce/src -u${DX_ENV} -w60
