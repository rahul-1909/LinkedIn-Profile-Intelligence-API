import os
import sys
import traceback
from pathlib import Path

# Add project root to sys.path so 'app' imports resolve on Vercel Serverless
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from app.main import app
except Exception as exc:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()
    err_tb = traceback.format_exc()
    err_msg = str(exc)
    err_type = type(exc).__name__

    @app.api_route(
        "/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
    )
    async def debug_fallback(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "StartupError",
                "message": err_msg,
                "type": err_type,
                "traceback": err_tb.splitlines(),
                "path": full_path,
                "sys_path": sys.path,
                "cwd": os.getcwd(),
            },
        )


__all__ = ["app"]
