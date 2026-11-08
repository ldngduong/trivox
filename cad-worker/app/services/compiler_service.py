"""Subprocess execution service for compiling sand3d geometry in isolation."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict
from app.constants.sandbox_rules import META_DELIMITER
from app.utils.ast_validator import validate_sand3d_code
from app.utils.code_sanitizer import sanitize_and_build_runner_script


def compile_in_subprocess(
    code: str,
    output_glb_path: str,
    timeout_sec: float = 25.0,
) -> Dict[str, Any]:
    """Validate AST and execute sand3d code in an isolated subprocess worker."""
    t0 = time.perf_counter()
    validate_sand3d_code(code)

    abs_glb = os.path.abspath(output_glb_path)
    abs_blend = os.path.splitext(abs_glb)[0] + ".blend"
    os.makedirs(os.path.dirname(abs_glb), exist_ok=True)
    script_content = sanitize_and_build_runner_script(code)

    with tempfile.NamedTemporaryFile(
        "w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(script_content)
        tmp_path = tmp.name

    try:
        proc = subprocess.run(
            [sys.executable, tmp_path, abs_glb],
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            encoding="utf-8",
            errors="replace",
        )
        combined = (proc.stdout or "") + "\n" + (proc.stderr or "")
        meta = None
        for line in combined.splitlines():
            if META_DELIMITER in line:
                raw_json = line.split(META_DELIMITER, 1)[1]
                meta = json.loads(raw_json)

        elapsed_ms = round((time.perf_counter() - t0) * 1000)
        if meta and meta.get("ok"):
            return {
                "ok": True,
                "elapsedMs": elapsed_ms,
                "glbPath": abs_glb,
                "blendPath": abs_blend if os.path.exists(abs_blend) else None,
                "parts": meta.get("parts", []),
                "joints": meta.get("joints", []),
                "dimensions": meta.get(
                    "dimensions", {"width": 0, "depth": 0, "height": 0}
                ),
            }

        error_msg = (
            meta.get("error")
            if meta
            else (
                proc.stderr.strip()
                or proc.stdout.strip()
                or "Unknown geometry compilation error"
            )
        )
        tb_msg = meta.get("traceback", "") if meta else proc.stderr
        return {
            "ok": False,
            "elapsedMs": elapsed_ms,
            "error": error_msg,
            "traceback": tb_msg[-1500:] if tb_msg else "",
        }
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "elapsedMs": round((time.perf_counter() - t0) * 1000),
            "error": f"Model compilation timed out after {timeout_sec}s.",
            "traceback": "",
        }
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except OSError:
            pass
