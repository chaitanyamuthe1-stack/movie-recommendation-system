"""
Centralized NumPy Model-Loading Utility
========================================
Provides safe_npy_load(), a single point of control for all np.load() calls
across the recommendation module.

Security policy:
- Default: allow_pickle=False  (safe for numeric .npy artifacts)
- Opt-in:  allow_pickle=True   only when the caller explicitly marks the file as
           a trusted pickled-object artifact AND the load raises the exact
           ValueError that NumPy emits for pickled arrays.
- All other exceptions propagate unchanged (never silently suppressed).

Validation:
- File existence is checked before loading.
- After loading, callers can pass expected_ndim and expected_dtype to validate
  the returned array's shape rank and element type.
"""

import os
import logging
from typing import Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# The exact substring NumPy emits when allow_pickle=False is needed.
_PICKLE_ERROR_FRAGMENT = "allow_pickle=False"


class NpyLoadError(Exception):
    """Raised when a .npy file cannot be loaded or fails validation."""


def safe_npy_load(
    path: str,
    *,
    allow_pickle: bool = False,
    trusted_pickle: bool = False,
    expected_ndim: Optional[int] = None,
    expected_dtype: Optional[Union[type, np.dtype, str]] = None,
    expected_shape: Optional[Tuple[Optional[int], ...]] = None,
) -> np.ndarray:
    """
    Load a .npy file with strict security defaults and optional validation.

    Parameters
    ----------
    path : str
        Absolute or relative path to the .npy file.
    allow_pickle : bool
        When True, forces pickle-mode from the first attempt (bypass the
        retry logic). Use only for files that are *inherently* pickled
        (e.g., object-dtype arrays). Ignored when trusted_pickle=True, which
        controls the *retry* behaviour.
    trusted_pickle : bool
        When True AND the first load attempt raises the NumPy pickle-required
        ValueError, the loader retries with allow_pickle=True.  Set this only
        for known, trusted model artifacts that contain object arrays.
        Has no effect when allow_pickle=True is also passed.
    expected_ndim : int, optional
        If provided, the loaded array must have this many dimensions.
    expected_dtype : dtype-like, optional
        If provided, the loaded array's dtype must be compatible.
        Passed to np.result_type() for comparison.
    expected_shape : tuple of (int | None), optional
        If provided, each axis size is checked.  Use None for a wildcard axis,
        e.g. (None, 128) to accept any first dimension but exactly 128 columns.

    Returns
    -------
    np.ndarray

    Raises
    ------
    NpyLoadError
        File missing, corrupted, wrong shape/dtype, or any other load failure.
    """
    # 1. File existence check
    if not os.path.exists(path):
        raise NpyLoadError(f"Model file not found: {path!r}")

    if not os.path.isfile(path):
        raise NpyLoadError(f"Path is not a regular file: {path!r}")

    # 2. Load — first attempt always with the requested pickle mode
    arr: np.ndarray
    try:
        arr = np.load(path, allow_pickle=allow_pickle)
    except ValueError as exc:
        # NumPy raises ValueError when a pickled array is encountered and
        # allow_pickle=False.  Retry only if the caller explicitly trusts this
        # artifact and the error message matches the known pattern.
        err_msg = str(exc)
        if (
            trusted_pickle
            and not allow_pickle
            and _PICKLE_ERROR_FRAGMENT in err_msg
        ):
            logger.warning(
                "File %r requires pickle. Retrying with allow_pickle=True "
                "(trusted_pickle=True was set by caller).",
                path,
            )
            try:
                arr = np.load(path, allow_pickle=True)
            except Exception as retry_exc:
                raise NpyLoadError(
                    f"Failed to load trusted pickled artifact {path!r}: {retry_exc}"
                ) from retry_exc
        else:
            # Unrelated ValueError (e.g. truncated header) – do not swallow it.
            raise NpyLoadError(
                f"Failed to load {path!r}: {exc}"
            ) from exc
    except Exception as exc:
        # Catch-all for IOError, EOFError, etc. (corrupted files).
        raise NpyLoadError(
            f"Failed to load {path!r}: {type(exc).__name__}: {exc}"
        ) from exc

    # 3. Post-load structural validation
    _validate_array(arr, path, expected_ndim, expected_dtype, expected_shape)

    logger.debug(
        "Loaded %r — shape=%s dtype=%s",
        path,
        arr.shape,
        arr.dtype,
    )
    return arr


def _validate_array(
    arr: np.ndarray,
    path: str,
    expected_ndim: Optional[int],
    expected_dtype: Optional[Union[type, np.dtype, str]],
    expected_shape: Optional[Tuple[Optional[int], ...]],
) -> None:
    """Internal helper: validate array structure after loading."""

    # ndim check
    if expected_ndim is not None and arr.ndim != expected_ndim:
        raise NpyLoadError(
            f"Array from {path!r} has {arr.ndim} dimensions; "
            f"expected {expected_ndim}."
        )

    # dtype check  (use np.issubdtype for broad families, e.g. floating)
    if expected_dtype is not None:
        # np.dtype() cannot convert abstract type families like np.floating or
        # np.integer; detect them with np.issubdtype directly.
        try:
            _is_abstract = isinstance(expected_dtype, type) and issubclass(
                expected_dtype, np.generic
            ) and expected_dtype in (
                np.floating, np.integer, np.signedinteger,
                np.unsignedinteger, np.complexfloating, np.number,
                np.inexact,
            )
        except TypeError:
            _is_abstract = False

        if _is_abstract:
            dtype_ok = np.issubdtype(arr.dtype, expected_dtype)
        else:
            try:
                concrete = np.dtype(expected_dtype)
                dtype_ok = np.issubdtype(arr.dtype, concrete.type) or arr.dtype == concrete
            except TypeError:
                # Fallback: treat as abstract family
                dtype_ok = np.issubdtype(arr.dtype, expected_dtype)

        if not dtype_ok:
            raise NpyLoadError(
                f"Array from {path!r} has dtype {arr.dtype!r}; "
                f"expected {expected_dtype!r}."
            )

    # shape check
    if expected_shape is not None:
        if arr.ndim != len(expected_shape):
            raise NpyLoadError(
                f"Array from {path!r} has {arr.ndim} dimensions but "
                f"expected_shape has {len(expected_shape)} axes."
            )
        for axis, (actual, expected) in enumerate(
            zip(arr.shape, expected_shape)
        ):
            if expected is not None and actual != expected:
                raise NpyLoadError(
                    f"Array from {path!r} has size {actual} on axis {axis}; "
                    f"expected {expected}."
                )
