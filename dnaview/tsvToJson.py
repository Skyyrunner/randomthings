import json

f = open("chromosomeLengths","r")
fout = open("chromosomeLengths.json", "w")
out = []
for line in f:
	line = line.strip()
	strs = line.split("\t")
	strs[1] = int(strs[1])
	strs[2] = int(strs[2])
	out.append(strs)

#fout.write(json.dumps(out, sort_keys=True, indent=4, separators=(',', ': ')))
fout.write(json.dumps(out, separators=(',', ': ')))