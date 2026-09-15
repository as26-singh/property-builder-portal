"""
Thin proxy — required ONLY for the Emergent preview environment.

Emergent's supervisor runs `uvicorn server:app` in /app/backend on port 8001.
This file spawns the real Node.js/Express backend on port 8002 and forwards
every request to it, keeping cookies and headers intact so the React app
never notices.

FOR LOCAL DEVELOPMENT, DELETE THIS FILE — just run `node server.js` directly.
"""

import atexit
import os
import subprocess
import time
from contextlib import asynccontextmanager
from urllib.parse import urlencode

import httpx
from fastapi import FastAPI, Request
from starlette.responses import Response

NODE_PORT = int(os.environ.get("NODE_PORT", "8002"))
NODE_URL = f"http://127.0.0.1:{NODE_PORT}"
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

node_proc = None

HOP_HEADERS = {"content-length", "transfer-encoding", "connection", "host"}


def start_node():
    global node_proc
    if node_proc and node_proc.poll() is None:
        return
    env = {**os.environ, "PORT": str(NODE_PORT), "HOST": "127.0.0.1"}
    node_proc = subprocess.Popen(["node", "server.js"], cwd=BACKEND_DIR, env=env)
    for _ in range(60):
        try:
            r = httpx.get(f"{NODE_URL}/api/", timeout=1.0)
            if r.status_code < 500:
                print(f"[proxy] Node backend ready on {NODE_URL}")
                return
        except Exception:
            time.sleep(0.5)
    print("[proxy] WARNING: Node backend not responding yet")


def stop_node():
    global node_proc
    if node_proc and node_proc.poll() is None:
        node_proc.terminate()
        try:
            node_proc.wait(timeout=5)
        except Exception:
            node_proc.kill()


atexit.register(stop_node)


@asynccontextmanager
async def lifespan(_app):
    start_node()
    yield
    stop_node()


app = FastAPI(lifespan=lifespan)


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(request: Request, full_path: str):
    query = urlencode(list(request.query_params.multi_items())) if request.query_params else ""
    url = f"{NODE_URL}/{full_path}" + (f"?{query}" if query else "")
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_HEADERS}
    body = await request.body()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.request(
                request.method,
                url,
                headers=headers,
                content=body,
                follow_redirects=False,
            )
    except httpx.ConnectError:
        start_node()
        return Response(content=b"Backend starting...", status_code=503)

    # Preserve every response header verbatim (needed for Set-Cookie which can appear multiple times).
    resp = Response(content=r.content, status_code=r.status_code)
    resp.raw_headers = [
        (k.encode("latin-1"), v.encode("latin-1"))
        for k, v in r.headers.multi_items()
        if k.lower() not in HOP_HEADERS and k.lower() != "content-encoding"
    ]
    return resp
