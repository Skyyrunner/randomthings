from sys import argv

try:
    fin = open(argv[1], 'r')
    fout = open(argv[2], 'w')
except:
    print "python strip.py filein fileout"
    quit()

for line in fin:
    line = line.strip()
    fout.write(line)
