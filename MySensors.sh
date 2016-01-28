#!/bin/sh
# pidfile must be first argument
PIDFILE=$1
mkdir -p /home/pi/logs
cd /home/pi/mysensors-node
node SensorControl.js >>/home/pi/logs/NodeJsController.log 2>&1 </dev/null &
CHILD="$!"
echo $CHILD > $PIDFILE
