#!/bin/bash

FILE='IEE_ElectivePickerAngular'
EXT='resource'

# remove old zip file if it exists
if [ -f Salesforce/src/staticresources/$FILE.$EXT ]; then
   rm Salesforce/src/staticresources/$FILE.$EXT;
   echo -e "removed old version of $FILE.$EXT\n"
else
   echo -e "$FILE.$EXT does not exist\n"
fi

cd dist

# compress new version
echo -e "Compressing files to $FILE.$EXT"
zip -r "../Salesforce/src/staticresources/$FILE.$EXT" *

echo -e "\nFinished creating $FILE.$EXT\n"
