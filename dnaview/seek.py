# Test how long it takes to seek.
# chr21 has 898151 lines.

f = open('chr21_stripped.txt', 'r')
f.seek(898149*50)
print f.read(100)
