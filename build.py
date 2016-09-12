#!/usr/bin/env python

from __future__ import print_function

import os
import os.path
import errno
import time
import argparse

SRC_DIR = 'src'
PUB_DIR = 'public'
TMPL_DIR = 'templates'
INDENT = 3

def write_page(pout, pin, tmpl, force, verbose):
    last_mod = os.path.getmtime(pin)
    lm_str = time.strftime("%Y-%m-%d", time.gmtime(last_mod))
    time_in = max(last_mod, tmpl.time)
    if os.path.isfile(pout):
        time_out = os.path.getmtime(pout)
    else:
        time_out = 0
    if time_in > time_out or force:
        dout = os.path.dirname(pout)
        try:
            os.makedirs(dout)
            if verbose >= 2:
                print('created dir', dout)
        except OSError:
            if not os.path.isdir(dout):
                raise
        with open(pout, 'w') as fout:
            if verbose >= 1:
                print('writing', pout)
            if pout.endswith('.html'):
                if verbose >= 2:
                    print('  = ', (tmpl.phead, pin, tmpl.pfoot))
                fout.write(tmpl.head)
                with open(pin) as fin:
                    for line in fin:
                        fout.write('  ' * INDENT + line)
                fout.write(tmpl.foot.replace('<!--LAST_MODIFIED-->', lm_str, 1))
            else:
                if verbose >= 2:
                    print('  = ', pin)
                with open(pin) as fin:
                    fout.write(fin.read())
    elif verbose >= 2:
        print('skipping', pout)
    
def set_tmpl(path, tin=None):
    tout = type('', (), {})
    if tin is None:
        tout.time = 0
    else:
        tout.time = tin.time
    phead = os.path.join(path, TMPL_DIR, 'head.html')
    if os.path.isfile(phead):
        tout.phead = phead
        with open(phead) as f:
            tout.head = f.read()
        tout.time = max(tout.time, os.path.getmtime(phead))
    else:
        tout.phead = tin.phead
        tout.head = tin.head
    pfoot = os.path.join(path, TMPL_DIR, 'foot.html')
    if os.path.isfile(pfoot):
        tout.pfoot = pfoot
        with open(pfoot) as f:
            tout.foot = f.read()
        tout.time = max(tout.time, os.path.getmtime(pfoot))
    else:
        tout.pfoot = tin.pfoot
        tout.foot = tin.foot
    return tout

def build_dir(pub_dir, src_dir, tin, force, verbose):
    tmpl = set_tmpl(src_dir, tin)
    for f in filter(lambda f: not f.endswith(('#', '~')), os.listdir(src_dir)):
        pin = os.path.join(src_dir, f)
        pout = os.path.join(pub_dir, f)
        if os.path.isdir(pin) and f != TMPL_DIR:
            build_dir(pout, pin, tmpl, force, verbose)
        elif os.path.isfile(pin):
            write_page(pout, pin, tmpl, force, verbose)

def clean_dir(pub_dir, force, verbose):
    for f in os.listdir(pub_dir):
        path = os.path.join(pub_dir, f)
        if os.path.isdir(path):
            clean_dir(path, force, verbose)
            try:
                os.rmdir(path)
            except OSError as e:
                if e.errno != errno.ENOTEMPTY:
                    raise
        else:
            pin = os.path.join(SRC_DIR, os.path.relpath(path, PUB_DIR))
            if not os.path.isfile(pin) or force:
                if verbose >= 1:
                    print('removing', path)
                os.remove(path)


def main():
    global args
    ap = argparse.ArgumentParser()
    ap.add_argument('-v', '--verbose', action='count', default=0,
                    help='increase output verbosity')
    ap.add_argument('-f', '--force', action='store_true',
                    help='increase output verbosity')
    args = ap.parse_args()
    
    root_dir = os.path.dirname(__file__)
    src_dir = os.path.join(root_dir, SRC_DIR)
    pub_dir = os.path.join(root_dir, PUB_DIR)

    clean_dir(pub_dir, args.force, args.verbose);
    build_dir(pub_dir, src_dir, None, args.force, args.verbose)

if __name__ == '__main__':
    main()
