#!/usr/bin/env python3

import os
import os.path
import errno
import http.server
import socketserver
import time
import _thread
import argparse

SRC_DIR = 'src'
PUB_DIR = 'public'
TMPL_DIR = 'templates'
INDENT = 3

PORT = 8000

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

def clean_dir(pub_dir, src_dir, force, verbose):
    for f in filter(lambda f: not f.startswith('.'), os.listdir(pub_dir)):
        pin = os.path.join(src_dir, f)
        pout = os.path.join(pub_dir, f)
        if os.path.isdir(pout):
            clean_dir(pout, pin, force, verbose)
            try:
                os.rmdir(pout)
            except OSError as e:
                if e.errno != errno.ENOTEMPTY:
                    raise
        else:
            if os.path.isdir(pin) or not os.path.exists(pin) or force:
                if verbose >= 1:
                    print('removing', pout)
                os.remove(pout)
                
def build(args):
    clean_dir(args.publish_dir, args.source_dir, args.force, args.verbose);
    build_dir(args.publish_dir, args.source_dir, None, args.force, args.verbose)

def track_files(args):
    while True:
        build(args)
        time.sleep(1)

def server(args):
    _thread.start_new_thread(track_files, (args, ))

    os.chdir(args.publish_dir)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(('', PORT), handler) as httpd:
        print('Serving {} at http://localhost:{}/'.format(args.publish_dir, PORT))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.shutdown()
    
class AbsPath(argparse.Action):
    def __call__(self, parser, namespace, values, option_string):
        setattr(namespace, self.dest, os.path.abspath(values))

def main():
    global args
    root_dir = os.path.abspath(os.getcwd())
    ap = argparse.ArgumentParser()

    ap.add_argument('-s', '--source-dir', action=AbsPath,
                    default=os.path.abspath(os.path.join(root_dir, SRC_DIR)),
                    help='set source directory')
    ap.add_argument('-p', '--publish-dir', action=AbsPath,
                    default=os.path.abspath(os.path.join(root_dir, PUB_DIR)),
                    help='set publishing directory')
    ap.add_argument('-v', '--verbose', action='count', default=0,
                    help='increase output verbosity')
    ap.add_argument('-f', '--force', action='store_true',
                    help='force rebuild of all files')
    ap.add_argument('--server', dest='func', action='store_const',
                    const=server, default=build,
                    help='run server for testing')

    args = ap.parse_args()
    args.func(args)

if __name__ == '__main__':
    main()
