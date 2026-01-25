#!/usr/bin/env python3

# This file is only meant to be run manually on the markdown files in the recipes folder.
# It's about time I replace this script with a proper markdown static website generator.

import os
import markdown
import frontmatter
import time

DIR = './src/recipes/'
HEADER = './src/templates/head.html'
FOOTER = './src/templates/foot.html'

def main():
    # clean dir
    for fname in os.listdir(DIR):
        if os.path.splitext(fname)[1] == '.raw':
            os.remove(os.path.join(DIR, fname))
    
    # parse headers
    with open(HEADER, 'r', encoding='utf-8') as fhead:
        header = fhead.read()
    with open(FOOTER, 'r', encoding='utf-8') as fhead:
        footer = fhead.read()

    # recipes: .md -> .html.raw
    recipes = []
    for fname in os.listdir(DIR):
        full_name = os.path.join(DIR, fname)
        (base_name, ext) = os.path.splitext(full_name)
        if ext == '.raw':
            continue
        if ext == '.md':
            last_mod = os.path.getmtime(full_name)
            last_mod_str = time.strftime("%Y-%m-%d", time.gmtime(last_mod))
            with open(full_name, 'r', encoding='utf-8') as fin:
                doc = frontmatter.load(fin)
            if doc.content == '':
                print('INFO: skipping empty file:', fname)
                continue
            with open(base_name + '.html.raw', 'w', encoding='utf-8') as fout:
                fout.write(header)
                src = ''
                if 'bron' in doc:
                    src = doc['bron']
                elif 'src' in doc:
                    src = doc['src']
                if src.startswith('http'):
                    fout.write(f'<a href="{src}">Bron</a>\n')
                elif not src == '':
                    fout.write(f'Bron: {src}\n')
                fout.write(markdown.markdown(doc.content))
                fout.write(footer.replace('<!--LAST_MODIFIED-->', last_mod_str, 1))
            recipes.append(os.path.splitext(fname)[0])
        else:
            print('WARNING: unexpected file:', fname)
    
    # index
    recipes.sort()
    with open(os.path.join(DIR, 'index.html.raw'), 'w', encoding='utf-8') as findex:
        findex.write(header)
        findex.write('<ul>')
        for recipe in recipes:
            findex.write(f'<li><a href="/recipes/{recipe}.html">{recipe}</a></li>\n')
        findex.write('</ul>')
        findex.write(footer)

if __name__ == '__main__':
    main()
