"""AST security validator for user/LLM generated sand3d Python scripts."""
import ast
from app.constants.sandbox_rules import (
    ALLOWED_IMPORTS,
    FORBIDDEN_ATTRS,
    FORBIDDEN_CALLS,
)


class ASTSecurityError(ValueError):
    """Raised when generated Python code violates sandbox AST rules."""


def validate_sand3d_code(source: str) -> None:
    """Parse and validate Python code to ensure only safe sand3d/math operations exist."""
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        raise ValueError(f"SyntaxError at line {exc.lineno}: {exc.msg}") from exc

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_pkg = alias.name.split(".")[0]
                if root_pkg not in ALLOWED_IMPORTS:
                    raise ASTSecurityError(
                        f"Import '{alias.name}' is not allowed. Only 'import sand3d as s3d' and 'import math' are permitted."
                    )
        elif isinstance(node, ast.ImportFrom):
            root_pkg = (node.module or "").split(".")[0]
            if root_pkg not in ALLOWED_IMPORTS:
                raise ASTSecurityError(
                    f"Import from '{node.module}' is not allowed. Use 'import sand3d as s3d'."
                )
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                raise ASTSecurityError(
                    f"Calling '{node.func.id}()' is forbidden in sandbox."
                )
        elif isinstance(node, ast.Attribute):
            if node.attr in FORBIDDEN_ATTRS:
                raise ASTSecurityError(
                    f"Attribute access '{node.attr}' is forbidden in sandbox."
                )
