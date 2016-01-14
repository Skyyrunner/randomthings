"""This example can handle the URIs:
/       ->  Root.index
/page   ->  Root.page
/node   ->  Node.__call__
"""
import cherrypy
import random
import templogs, loadlogs
import os, time, sys
from os.path import abspath, dirname, basename
import datetime
import glob
from urllib import quote
from simplejson.decoder import JSONDecodeError
from cherrypy.lib.static import serve_file

from grapher import GraphServer
import logging

# Code idea from https://bitbucket.org/cherrypy/cherrypy/issue/1157/documentation-bugs-enhancements for safer file downloads
# However, the code was broken, and I only used the algorithm ideas for the most part.
allowed_paths = map(abspath, ['files'])
def allowed(path):
    print path
    for p in allowed_paths:
        if p in path:
            return True
    return False
    #return any((lambda x: x.startswith(abspath(dirname(path))), allowed_paths))
    

class Node(object):
    exposed = True

    def __init__(self, content = None):
        if (content == None):
            self.text = "The node content" 
        else:
            self.text = content

    def __call__(self):
        return "The node content: " + self.text

class AppPage(object):
    exposed = True
    def __init__(self):
        self.node = Node("APP PAGE NODE")

    def __call__(self):
		return "This is an app page!"


def loadPage(pages, filename):
    pages[filename] = "";
    with open("graph/" + filename, "r") as f:
        for line in f:
            pages[filename] += line;


class Root(object):
    def __init__(self):
        self.node = Node()
        self.appage = AppPage()
        self.pages = dict()
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        self.grapher = GraphServer(self.current_dir, self.pages)
        
        self.filelog = logging.getLogger("filelog")
        self.fh = logging.FileHandler('filelog.log')
        formatter = logging.Formatter(fmt='%(asctime)s.%(msecs)s\t%(name)s\t%(levelname)s\t%(message)s', datefmt='%Y/%m/%d\t%H:%M:%S')
        self.fh.setFormatter(formatter)
        self.filelog.addHandler(self.fh)
        
        
        filenames = ["loading.html", "viewer.html", "mainpage.html"]
        
        for fn in filenames:
            loadPage(self.pages, fn)    
        
#////////////////////////////////////////////////      

    @cherrypy.expose
    def index(self):
        return "The index of the root object"

#////////////////////////////////////////////////

    @cherrypy.expose
    def files(self, directory=None):
        if not directory:
            html = '<html><body><h2>Select a download directory:</h2>%s</body></html>'
            return html % ('<br />'.join(map(lambda x: '<a href="?directory=%s">%s</a>' % (x, basename(x)), allowed_paths)))
        
        if not allowed(str(directory)):        
            html = '<html><body><h2>Access denied</h2>Go away :I</body></html>'
            return html
        
        
        
        directory = abspath(directory)
        html = ''

        for filename in glob.glob('%s/*' % directory):
            absPath, baseName = map(quote, (abspath(filename), basename(filename)))
            if os.path.isdir(absPath):
                html += '<a href="?directory=%s">%s</a> <br />' % (absPath, baseName)
            else:
                html += '<a href="/getfile?directory=%s&filename=%s">%s</a> <br />' % (absPath, baseName, baseName)
        
        if not directory=="/home/skyrunner/webserver/files":            
            return """<html><body><h2>Files in the selected directory:</h2>
        <a href="?directory=%s">Up</a><br />
        %s</body></html>""" % (dirname(directory), html)
        else:
            return """<html><body><h2>Here are the files in the selected directory:</h2>%s</body></html>""" % (html)
    
    @cherrypy.expose
    def getfile(self, directory, filename):
        #filepath = '%s/%s' % (directory, basename(filename))
        filepath = directory
        if not allowed(filepath):
            self.filelog.warning(cherrypy.request.headers["Remote-Addr"] + "\tAccess denied\t%s", filepath)
            raise cherrypy.HTTPError(403, 'You are not allowed to access files in this directory. Access denied. Go away.')
            return
        self.filelog.info(cherrypy.request.headers["Remote-Addr"] + "\tFile accessed\t%s\t%d", filepath, os.path.getsize(filepath))
        return serve_file(abspath(filepath))#, "application/x-download", "attachment")

#////////////////////////////////////////////////

    @cherrypy.expose
    def load(self, length = None):
        path = '/home/skyrunner/webserver/resources' 
        for f in os.listdir(path):
            if os.stat(path + '/' + f).st_mtime < time.time() - 600: #remove all files older than 10 minutes
                if os.path.isfile(path + '/' + f):
                    os.remove(path + '/' + f)

        if (not os.path.isfile(path + '/' + "lg%s.png" % (length))): #if the file I seek exists not
            print "attempting to make file %s" % ("lg%s.png" % (length))
            reader = loadlogs.LoadLogs()
            length = reader.saveLoadGraph(length)
	if length == None:
		return """<html><head><title>Temp logs:Error</title><body>
<p><b>Incorrect input -- check URL.</b></p></body>"""

        return """ <html>
<head>
<title>CPU load logs</title>
</head>
<html>
<body>
<img height="500" src="/images/lg%s.png" alt="CPU load graph">
<p>Last %s</p>
</body>
</html>""" % (length, str(datetime.timedelta(minutes=int(length))))


    @cherrypy.expose
    def temps(self, length = None):
        path = '/home/skyrunner/webserver/resources'
	originalInput = length
        for f in os.listdir(path):
            if os.path.getmtime(path + '/' + f) < time.time() - 600: #remove all files older than 10 minutes
                if os.path.isfile(path + '/' + f):
                    os.remove(path + '/' + f)

        if (not os.path.isfile(path + '/' + "tg%s.png" % (length))): #if the file I seek exists not
            print "attempting to make file %s" % ("tg%s.png" % (length))
            reader = templogs.TempLogs()         
	    length = reader.saveTempGraph(length)

	if length == None:
		return """<html><head><title>Temp logs:Error</title><body>
<p><b>Incorrect input -- check URL.</b></p></body>"""

        return """ <html>
<head>
<title>Temp logs</title>
</head>
<html>
<body>
<img height="500" src="/images/tg%s.png" alt="Temp log graph">
<p>Last %s minutes</p>
</body>
</html>""" % (length, str(datetime.timedelta(minutes=int(length))))

    @cherrypy.expose
    def lock(self):        
        return serve_file(os.path.join(self.current_dir, "files/helloworld.txt"), content_type='text/plain')
        
    @cherrypy.expose
    def graph(self, arg, arg2 = None):
        if arg2 == None:
            return serve_file(self.current_dir + "/graph/" + arg)
        else:
            return serve_file(self.current_dir + "/graph/" + arg + "/" + arg2)


if __name__ == '__main__':
    conf = {'/images': {'tools.staticdir.on': True,
        'tools.staticdir.dir': '/home/skyrunner/webserver/resources'},
            '/download': {'tools.staticdir.on': True, 'tools.staticdir.dir': '/home/skyrunner/webserver/files'},
            '/logs' : {'tools.staticdir.on': True, 'tools.staticdir.dir': '/home/skyrunner/webserver/graph/locks'},
            '/graphdata' : {'tools.staticdir.on': True, 'tools.staticdir.dir': '/home/skyrunner/webserver/graph/out'},
            '/js' : {'tools.staticdir.on': True, 'tools.staticdir.dir': '/home/skyrunner/js'},
           '/html' : {'tools.staticdir.on': True, 'tools.staticdir.dir': '/home/skyrunner/html'}}
    cherrypy.config.update({'tools.sessions.on' : True})
    cherrypy.config.update({'server.socket_host': '165.132.79.33',
                        'server.socket_port': 60001,
                       })
    logging.basicConfig(filename = "viewerlog.log", level=logging.INFO, format='%(asctime)s.%(msecs)s\t%(name)s\t%(levelname)s\t%(message)s', datefmt='%Y/%m/%d\t%H:%M:%S') 
    cherrypyAccessLogger = logging.getLogger("cherrypy")
    cherrypyAccessLogger.addHandler(logging.FileHandler('cherrypylogs.log'))
    root = Root()
    cherrypy.quickstart(Root(), "/", conf)
