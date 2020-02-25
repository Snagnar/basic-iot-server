#!/bin/bash

# This is an example script for a query argument parser
# You can add as many scripts in this directory as you want.
#
# But keep in mind that the scripts will be executed proceduraly, so
# script which take very long to execute might not be the best idea...
#
# author: Snagnar

echo "in example_post route"
echo "got query arguments: $@"
