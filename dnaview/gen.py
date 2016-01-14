# Download files for and generate all graphs in order.

from subprocess import call
from sys import argv
from os import path
from analyze import analyze

# list of urls to wget files from.
urls = [ 'http://gutenberg.readingroo.ms/etext02/01hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/02hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/03hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/04hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/05hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/06hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/07hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/08hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/09hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/10hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/11hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/12hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/13hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/14hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/15hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/16hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/17hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/18hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/19hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/20hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/21hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/22hgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/0xhgp10a.zip',
 'http://gutenberg.readingroo.ms/etext02/0yhgp10a.zip']

for url in urls:
    filename = url.split("/")[-1]
    if not path.exists("raw/" + filename):
        call(["wget", "-P", "raw/", url])
    # call(["python3", "analyze.py", "raw/" + filename])
    analyze("raw/" + filename, "lab")