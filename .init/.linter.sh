#!/bin/bash
cd /home/kavia/workspace/code-generation/image-processing-suite-139424-139434/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

