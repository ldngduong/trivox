"""Sanitization helpers for preparing sand3d source code before runner injection."""
from app.constants.sandbox_rules import RUNNER_TEMPLATE


def sanitize_and_build_runner_script(source: str) -> str:
    """Strip direct export calls and wrap source inside isolated runner template."""
    cleaned_lines = []
    for line in source.splitlines():
        stripped = line.strip()
        if stripped.startswith("s3d.export("):
            continue
        cleaned_lines.append(line)
    cleaned_code = "\n".join(cleaned_lines)
    return RUNNER_TEMPLATE.replace("{user_code}", cleaned_code)
