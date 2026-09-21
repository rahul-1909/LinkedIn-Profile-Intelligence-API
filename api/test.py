import sys
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/test")
def test_endpoint():
    return {
        "status": "ok",
        "python_version": sys.version,
        "platform": sys.platform,
    }
