import uvicorn

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  Starting LinkedIn Profile Intelligence API")
    print("  -> Web Dashboard : http://localhost:8000/")
    print("  -> Swagger Docs  : http://localhost:8000/docs")
    print("  -> Health Check  : http://localhost:8000/health")
    print("=" * 60 + "\n")

    # Only watch 'app' and 'web' to prevent OneDrive/.venv file-watch reload loops
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["app", "web"],
    )
