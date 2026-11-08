"""FastAPI router for health check and CAD model compilation endpoints."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter
from app.schemas.compile_schema import CompileRequestSchema, CompileResponseSchema
from app.services.compiler_service import compile_in_subprocess
from app.utils.ast_validator import ASTSecurityError

router = APIRouter()
WORKER_POOL = ThreadPoolExecutor(max_workers=2)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/compile", response_model=CompileResponseSchema)
async def compile_model(req: CompileRequestSchema):
    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(
            WORKER_POOL,
            compile_in_subprocess,
            req.code,
            req.outputPath,
            req.timeoutSec,
        )
        return result
    except ASTSecurityError as sec_err:
        return CompileResponseSchema(
            ok=False,
            elapsedMs=0,
            error=str(sec_err),
            traceback="",
        )
    except Exception as exc:
        return CompileResponseSchema(
            ok=False,
            elapsedMs=0,
            error=str(exc),
            traceback="",
        )
