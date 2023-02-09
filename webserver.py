import http.server
import socketserver
import sys
import os

# Simple version checker
if not sys.version_info.major == 3 and sys.version_info.minor >= 6:
    print("Python 3.6 or higher is required.")
    print("You are using Python {}.{}.".format(sys.version_info.major, sys.version_info.minor))
    sys.exit(1)


# HTTP request handler class
class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_PUT(self):
        filename = os.path.basename(self.path)
        if filename.endswith(".lua"):
            file_length = int(self.headers['Content-Length'])
            with open(filename, 'wb') as output_file:
                output_file.write(self.rfile.read(file_length))
            self.send_response(201, 'Created')
            self.end_headers()
            reply_body = 'Saved "%s"\n' % filename
            self.wfile.write(reply_body.encode('utf-8'))

    def do_GET(self):
        if self.path == '/web':
            self.path = 'index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)


PORT = input("SELECT A PORT (BETWEEN 7999 - 8100): ")
try:
    PORT = int(PORT)
    if 8000 <= PORT <= 8100:
        handler_obj = MyHttpRequestHandler
        with socketserver.TCPServer(("", PORT), handler_obj) as httpd:
            print(f"Server started at localhost on {PORT} with this directory as root")
            httpd.serve_forever()
    else:
        print("Port wasn't between the expected value.")
        exit(0)
except ValueError:
    print("Port wasn't a numeric value.")
    exit(0)
except KeyboardInterrupt:
    print("Server closed.")
