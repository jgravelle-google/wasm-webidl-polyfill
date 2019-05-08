#!/usr/bin/python

import os
import subprocess
import sys
import time

def run(cmd):
  return subprocess.check_output(cmd)

def listsplit(xs, item):
  i = xs.index(item)
  return xs[:i], xs[i+1:]

watchfiles, cmd = listsplit(sys.argv[1:], '--')
print 'watchfiles:', watchfiles
print 'cmd:', cmd
times = {}

while True:
  did_mod = False
  for file in watchfiles:
    mtime = os.path.getmtime(file)
    if times.get(file) != mtime:
      did_mod = True
    times[file] = mtime
  if did_mod:
    print 'file modified, running:', cmd
    try:
      print run(cmd)
    except Exception as e:
      print 'failed:', e
  time.sleep(1.0)
