#!/usr/bin/env python3
# Tayson PS4/PS5 - Golden Edition Server

import http.server
import socket
import os
import mimetypes

# ============================================
# SETTINGS
# ============================================
PORT = 8080

# ============================================
# GET IP
# ============================================
def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

# ============================================
# CUSTOM HANDLER
# ============================================
class MyHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[Tayson] {format % args}")

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        # Cache manifest
        if path.endswith('.manifest') or path.endswith('.cache'):
            return 'text/cache-manifest'
        # Payload files
        if path.endswith('.bin'):
            return 'application/octet-stream'
        # JavaScript modules
        if path.endswith('.mjs'):
            return 'application/javascript'
        # Default
        return super().guess_type(path)

# ============================================
# RUN SERVER
# ============================================
print("\n" + "="*50)
print("  ⚜️ TAYSON PS4/PS5 GOLDEN EDITION")
print("="*50)

try:
    with http.server.HTTPServer(("0.0.0.0", PORT), MyHandler) as httpd:
        print(f"[✓] Server is RUNNING")
        print(f"[✓] Port: {PORT}")
        print(f"[✓] Your IP: {get_ip()}")
        print(f"[✓] PS4 URL: http://{get_ip()}:{PORT}/")
        print("="*50)
        print("[!] Open this URL on your PS4 browser")
        print("[!] First time: wait for cache to install")
        print("[!] After that: works offline!")
        print("[!] Press Ctrl+C to stop")
        print("="*50 + "\n")

        httpd.serve_forever()

except KeyboardInterrupt:
    print("\n[✓] Server stopped")

except PermissionError:
    print("\n[✗] Error: Port already in use!")
    print(f"[!] Try changing PORT in the code")
    print("\n")

except Exception as e:
    print(f"\n[✗] Error: {e}")
    print("\n")