#!/bin/sh
cat > /sandbox/user_code.py

timeout 5 python /sandbox/user_code.py 2>&1
EXIT=$?

if [ $EXIT -eq 124 ]; then
  echo 'TimeoutError: Code exceeded 5 second limit'
fi
exit $EXIT