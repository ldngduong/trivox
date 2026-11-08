"""Sandbox security constants and runner script template for sand3d execution."""

ALLOWED_IMPORTS = {"sand3d", "math"}

FORBIDDEN_CALLS = {
    "eval",
    "exec",
    "open",
    "compile",
    "__import__",
    "input",
    "breakpoint",
    "globals",
    "locals",
    "getattr",
    "setattr",
    "delattr",
}

FORBIDDEN_ATTRS = {
    "__subclasses__",
    "__bases__",
    "__mro__",
    "__globals__",
    "__code__",
    "__builtins__",
    "system",
    "popen",
}

META_DELIMITER = "___S3D_META___"

RUNNER_TEMPLATE = r'''
import json
import math
import os
import struct
import sys
import traceback
import bpy
from mathutils import Vector
import sand3d as s3d

s3d.empty_scene()

# --- USER MODEL CODE START ---
{user_code}
# --- USER MODEL CODE END ---

def _find_root():
    ns = globals()
    for fn_name in ("build", "model", "create_model"):
        fn = ns.get(fn_name)
        if callable(fn):
            return fn()
    for var_name in ("result", "root", "assembly"):
        val = ns.get(var_name)
        if val is not None and not callable(val):
            return val
    raise ValueError(
        "Model code must define a callable `build()` function returning the root object or assembly."
    )

try:
    built = _find_root()
    out_glb = sys.argv[1]
    out_blend = os.path.splitext(out_glb)[0] + ".blend"
    s3d.export(built, out_glb)
    bpy.ops.wm.save_as_mainfile(
        filepath=out_blend,
        compress=True,
        check_existing=False,
    )

    with open(out_glb, "rb") as f:
        magic, version, length = struct.unpack("<4sII", f.read(12))
        chunk_len, chunk_type = struct.unpack("<I4s", f.read(8))
        gltf = json.loads(f.read(chunk_len).decode("utf-8"))

    joints = []
    parts = []
    for node in gltf.get("nodes", []):
        name = node.get("name", "")
        if "mesh" in node and name and not name.startswith("s3d~"):
            parts.append(name)
        j = node.get("extras", {}).get("s3d_joint")
        if j:
            j_type = j.get("type", "revolute")
            is_prismatic = j_type == "prismatic"
            lower_si = j.get("lower", -math.pi if j_type == "continuous" else 0.0)
            upper_si = j.get("upper", math.pi if j_type == "continuous" else (0.2 if is_prismatic else math.pi))
            joints.append({
                "id": j.get("name", name),
                "type": j_type,
                "unit": "mm" if is_prismatic else "°",
                "min": round(lower_si * 1000, 1) if is_prismatic else round(math.degrees(lower_si), 1),
                "max": round(upper_si * 1000, 1) if is_prismatic else round(math.degrees(upper_si), 1),
                "default": round(j.get("value", 0.0) * 1000, 1) if is_prismatic else round(math.degrees(j.get("value", 0.0)), 1),
            })

    xs, ys, zs = [], [], []
    for ob in bpy.context.scene.objects:
        if ob.type == "MESH":
            for corner in ob.bound_box:
                w = ob.matrix_world @ Vector(corner)
                xs.append(w.x)
                ys.append(w.y)
                zs.append(w.z)

    dims = {
        "width": round(max(ys) - min(ys), 1) if ys else 0,
        "depth": round(max(xs) - min(xs), 1) if xs else 0,
        "height": round(max(zs) - min(zs), 1) if zs else 0,
    }

    print("___S3D_META___" + json.dumps({
        "ok": True,
        "blendPath": out_blend,
        "parts": sorted(list(set(parts))),
        "joints": joints,
        "dimensions": dims,
    }))
except Exception as e:
    tb = traceback.format_exc()
    print("___S3D_META___" + json.dumps({
        "ok": False,
        "error": str(e),
        "traceback": tb,
    }))
    sys.exit(1)
'''
