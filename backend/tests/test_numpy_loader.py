"""
Unit Tests for the Centralized NumPy Model-Loading Utility
===========================================================
Tests cover:
  1. Normal numeric .npy loading (float32, int32, float64, 1-D and 2-D).
  2. Pickled object .npy loading (trusted_pickle retry path).
  3. Missing model files (NpyLoadError raised).
  4. Corrupted model files (NpyLoadError raised, not silently swallowed).
  5. Unexpected data types caught by expected_dtype validation.
  6. Unexpected dimensions caught by expected_ndim validation.
  7. Shape mismatch caught by expected_shape validation.
  8. allow_pickle=True direct mode for known object arrays.
  9. Partial wildcard shape matching (None axes).

All tests use a temporary directory so no real model artifacts are required.
"""

import os
import pickle
import shutil
import struct

import numpy as np
import pytest

from backend.app.ml.numpy_loader import NpyLoadError, safe_npy_load

# Use the project's scratch directory (writable inside the sandbox) instead of
# the system TEMP directory, which is read-only in some sandbox configurations.
_SCRATCH_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    ".test_scratch_numpy_loader",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _save_npy(tmp_dir: str, filename: str, arr: np.ndarray) -> str:
    """Save a numpy array to tmp_dir/filename and return the full path."""
    path = os.path.join(tmp_dir, filename)
    np.save(path, arr)
    return path


def _save_pickle_npy(tmp_dir: str, filename: str, obj) -> str:
    """Save an object-dtype array (requires pickle) to tmp_dir/filename."""
    path = os.path.join(tmp_dir, filename)
    arr = np.empty(1, dtype=object)
    arr[0] = obj
    np.save(path, arr, allow_pickle=True)
    return path


def _corrupt_file(path: str) -> None:
    """Overwrite the .npy magic header bytes to corrupt the file."""
    with open(path, "r+b") as fh:
        fh.seek(0)
        fh.write(b"\x00CORRUPTED\x00\x00\x00\x00\x00\x00")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def tmp_dir():
    """Use a project-local scratch directory that is writable in all environments."""
    os.makedirs(_SCRATCH_DIR, exist_ok=True)
    yield _SCRATCH_DIR
    # Clean up after the test module finishes
    shutil.rmtree(_SCRATCH_DIR, ignore_errors=True)


# ---------------------------------------------------------------------------
# 1. Normal numeric .npy loading
# ---------------------------------------------------------------------------

class TestNormalNumericLoading:
    def test_load_1d_float32(self, tmp_dir):
        arr = np.array([1.0, 2.0, 3.0], dtype=np.float32)
        path = _save_npy(tmp_dir, "vec_f32.npy", arr)
        loaded = safe_npy_load(path)
        assert loaded.dtype == np.float32
        np.testing.assert_array_equal(loaded, arr)

    def test_load_2d_float32(self, tmp_dir):
        arr = np.eye(5, dtype=np.float32)
        path = _save_npy(tmp_dir, "mat_f32.npy", arr)
        loaded = safe_npy_load(path)
        assert loaded.shape == (5, 5)
        assert loaded.dtype == np.float32
        np.testing.assert_array_almost_equal(loaded, arr)

    def test_load_2d_float64(self, tmp_dir):
        arr = np.random.rand(10, 10).astype(np.float64)
        path = _save_npy(tmp_dir, "mat_f64.npy", arr)
        loaded = safe_npy_load(path)
        assert loaded.dtype == np.float64
        assert loaded.shape == (10, 10)

    def test_load_int32_array(self, tmp_dir):
        arr = np.arange(20, dtype=np.int32).reshape(4, 5)
        path = _save_npy(tmp_dir, "mat_i32.npy", arr)
        loaded = safe_npy_load(path)
        assert loaded.dtype == np.int32
        assert loaded.shape == (4, 5)

    def test_load_returns_ndarray(self, tmp_dir):
        arr = np.zeros((3, 3), dtype=np.float32)
        path = _save_npy(tmp_dir, "zeros.npy", arr)
        loaded = safe_npy_load(path)
        assert isinstance(loaded, np.ndarray)

    def test_large_similarity_matrix(self, tmp_dir):
        """Simulates the content_similarity.npy / item_cf_similarity.npy pattern."""
        n = 100
        arr = np.random.rand(n, n).astype(np.float32)
        path = _save_npy(tmp_dir, "large_sim.npy", arr)
        loaded = safe_npy_load(path, expected_ndim=2, expected_dtype=np.floating)
        assert loaded.shape == (n, n)


# ---------------------------------------------------------------------------
# 2. Pickled object .npy loading
# ---------------------------------------------------------------------------

class TestPickledObjectLoading:
    def test_trusted_pickle_retries_on_pickle_error(self, tmp_dir):
        """When a pickled array is encountered, trusted_pickle=True allows retry."""
        path = _save_pickle_npy(tmp_dir, "obj_array.npy", {"key": "value"})
        # First: loading without pickle should raise NpyLoadError
        with pytest.raises(NpyLoadError, match="Failed to load"):
            safe_npy_load(path, allow_pickle=False, trusted_pickle=False)
        # Then: with trusted_pickle=True the retry should succeed
        loaded = safe_npy_load(path, allow_pickle=False, trusted_pickle=True)
        assert isinstance(loaded, np.ndarray)
        assert loaded.dtype == object
        assert loaded[0] == {"key": "value"}

    def test_allow_pickle_true_loads_object_array(self, tmp_dir):
        """Direct allow_pickle=True loads without needing the retry path."""
        path = _save_pickle_npy(tmp_dir, "obj_direct.npy", [1, 2, 3])
        loaded = safe_npy_load(path, allow_pickle=True)
        assert isinstance(loaded, np.ndarray)
        assert loaded[0] == [1, 2, 3]

    def test_pickle_required_without_trusted_raises(self, tmp_dir):
        """Pickled array without trusted_pickle=True must raise NpyLoadError."""
        path = _save_pickle_npy(tmp_dir, "obj_untrusted.npy", "secret")
        with pytest.raises(NpyLoadError):
            safe_npy_load(path)

    def test_trusted_pickle_does_not_suppress_other_errors(self, tmp_dir):
        """trusted_pickle=True must NOT swallow non-pickle ValueErrors."""
        path = os.path.join(tmp_dir, "bad.npy")
        # Write a valid .npy magic but truncate the data so NumPy raises
        # a generic error (not the pickle message).
        arr = np.array([1.0, 2.0], dtype=np.float32)
        np.save(path, arr)
        _corrupt_file(path)
        with pytest.raises(NpyLoadError):
            safe_npy_load(path, trusted_pickle=True)


# ---------------------------------------------------------------------------
# 3. Missing model files
# ---------------------------------------------------------------------------

class TestMissingFiles:
    def test_missing_file_raises_npy_load_error(self, tmp_dir):
        path = os.path.join(tmp_dir, "does_not_exist.npy")
        with pytest.raises(NpyLoadError, match="not found"):
            safe_npy_load(path)

    def test_missing_file_error_message_contains_path(self, tmp_dir):
        path = os.path.join(tmp_dir, "ghost_model.npy")
        with pytest.raises(NpyLoadError) as exc_info:
            safe_npy_load(path)
        assert "ghost_model.npy" in str(exc_info.value)

    def test_directory_instead_of_file_raises(self, tmp_dir):
        """Passing a directory path should raise NpyLoadError."""
        with pytest.raises(NpyLoadError, match="not a regular file"):
            safe_npy_load(tmp_dir)


# ---------------------------------------------------------------------------
# 4. Corrupted model files
# ---------------------------------------------------------------------------

class TestCorruptedFiles:
    def test_corrupted_file_raises_npy_load_error(self, tmp_dir):
        arr = np.ones((50, 50), dtype=np.float32)
        path = _save_npy(tmp_dir, "corrupted.npy", arr)
        _corrupt_file(path)
        with pytest.raises(NpyLoadError):
            safe_npy_load(path)

    def test_completely_invalid_file_raises(self, tmp_dir):
        path = os.path.join(tmp_dir, "garbage.npy")
        with open(path, "wb") as fh:
            fh.write(b"THIS IS NOT A NUMPY FILE AT ALL")
        with pytest.raises(NpyLoadError):
            safe_npy_load(path)

    def test_exception_is_not_silently_swallowed(self, tmp_dir):
        """NpyLoadError must be raised (not caught and ignored) on corrupt data."""
        arr = np.zeros((10,), dtype=np.float64)
        path = _save_npy(tmp_dir, "almost_valid.npy", arr)
        _corrupt_file(path)
        raised = False
        try:
            safe_npy_load(path)
        except NpyLoadError:
            raised = True
        assert raised, "NpyLoadError was not raised for a corrupted file"


# ---------------------------------------------------------------------------
# 5. Unexpected data types
# ---------------------------------------------------------------------------

class TestUnexpectedDtypes:
    def test_wrong_dtype_raises_npy_load_error(self, tmp_dir):
        """Loading an int array when float is expected should raise."""
        arr = np.arange(9, dtype=np.int32).reshape(3, 3)
        path = _save_npy(tmp_dir, "int_as_float.npy", arr)
        with pytest.raises(NpyLoadError, match="dtype"):
            safe_npy_load(path, expected_dtype=np.floating)

    def test_correct_float32_dtype_passes(self, tmp_dir):
        arr = np.ones((4, 4), dtype=np.float32)
        path = _save_npy(tmp_dir, "float32_ok.npy", arr)
        loaded = safe_npy_load(path, expected_dtype=np.float32)
        assert loaded.dtype == np.float32

    def test_float32_satisfies_floating_family(self, tmp_dir):
        """np.float32 should satisfy expected_dtype=np.floating (family check)."""
        arr = np.ones((3,), dtype=np.float32)
        path = _save_npy(tmp_dir, "f32_family.npy", arr)
        loaded = safe_npy_load(path, expected_dtype=np.floating)
        assert loaded is not None

    def test_float64_satisfies_floating_family(self, tmp_dir):
        arr = np.ones((3,), dtype=np.float64)
        path = _save_npy(tmp_dir, "f64_family.npy", arr)
        loaded = safe_npy_load(path, expected_dtype=np.floating)
        assert loaded is not None

    def test_int_does_not_satisfy_floating(self, tmp_dir):
        arr = np.array([1, 2, 3], dtype=np.int64)
        path = _save_npy(tmp_dir, "int64_vs_float.npy", arr)
        with pytest.raises(NpyLoadError, match="dtype"):
            safe_npy_load(path, expected_dtype=np.floating)


# ---------------------------------------------------------------------------
# 6 & 7. Dimension and shape validation
# ---------------------------------------------------------------------------

class TestDimensionAndShapeValidation:
    def test_wrong_ndim_raises(self, tmp_dir):
        arr = np.ones(10, dtype=np.float32)  # 1-D
        path = _save_npy(tmp_dir, "1d_as_2d.npy", arr)
        with pytest.raises(NpyLoadError, match="dimensions"):
            safe_npy_load(path, expected_ndim=2)

    def test_correct_ndim_passes(self, tmp_dir):
        arr = np.ones((5, 5), dtype=np.float32)
        path = _save_npy(tmp_dir, "2d_ok.npy", arr)
        loaded = safe_npy_load(path, expected_ndim=2)
        assert loaded.ndim == 2

    def test_shape_mismatch_raises(self, tmp_dir):
        arr = np.ones((4, 6), dtype=np.float32)
        path = _save_npy(tmp_dir, "shape_mismatch.npy", arr)
        with pytest.raises(NpyLoadError, match="size"):
            safe_npy_load(path, expected_shape=(4, 5))  # wrong 2nd axis

    def test_shape_wildcard_axis_passes(self, tmp_dir):
        arr = np.ones((100, 64), dtype=np.float32)
        path = _save_npy(tmp_dir, "wildcard_shape.npy", arr)
        # None in first axis = any size
        loaded = safe_npy_load(path, expected_shape=(None, 64))
        assert loaded.shape == (100, 64)

    def test_shape_ndim_mismatch_raises(self, tmp_dir):
        arr = np.ones((3, 3, 3), dtype=np.float32)
        path = _save_npy(tmp_dir, "3d_as_2d_shape.npy", arr)
        with pytest.raises(NpyLoadError):
            safe_npy_load(path, expected_shape=(3, 3))  # 2-tuple vs 3-D array

    def test_combined_ndim_dtype_shape_valid(self, tmp_dir):
        n = 50
        arr = (np.random.rand(n, n) * 0.5).astype(np.float32)
        path = _save_npy(tmp_dir, "combined_valid.npy", arr)
        loaded = safe_npy_load(
            path,
            expected_ndim=2,
            expected_dtype=np.floating,
            expected_shape=(n, n),
        )
        assert loaded.shape == (n, n)


# ---------------------------------------------------------------------------
# 8. Integration: content_based and collaborative loaders
# ---------------------------------------------------------------------------

class TestIntegrationWithRecommendationModels:
    """
    Smoke-test that content_based.py and collaborative.py now route through
    safe_npy_load by checking they import it and produce the correct call signature.
    """

    def test_content_based_imports_safe_npy_load(self):
        import importlib, inspect
        import backend.app.recommendation.content_based as mod
        src = inspect.getsource(mod)
        assert "safe_npy_load" in src, (
            "content_based.py must call safe_npy_load()"
        )
        assert "np.load(" not in src, (
            "content_based.py must not call bare np.load() directly"
        )

    def test_collaborative_imports_safe_npy_load(self):
        import inspect
        import backend.app.recommendation.collaborative as mod
        src = inspect.getsource(mod)
        assert "safe_npy_load" in src, (
            "collaborative.py must call safe_npy_load()"
        )
        assert "np.load(" not in src, (
            "collaborative.py must not call bare np.load() directly"
        )

    def test_numpy_loader_module_exists(self):
        from backend.app.ml import numpy_loader
        assert hasattr(numpy_loader, "safe_npy_load")
        assert hasattr(numpy_loader, "NpyLoadError")

    def test_npy_load_error_is_exception(self):
        from backend.app.ml.numpy_loader import NpyLoadError
        assert issubclass(NpyLoadError, Exception)
