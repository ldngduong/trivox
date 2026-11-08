"""FastAPI entrypoint for the CAD Geometry Worker Service."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.compile_router import router as compile_router

app = FastAPI(title="CAD Geometry Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compile_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
