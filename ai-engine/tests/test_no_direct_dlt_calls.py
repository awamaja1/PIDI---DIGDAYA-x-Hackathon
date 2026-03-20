import re
import unittest
from pathlib import Path


class TestAIDLTBoundaryGuard(unittest.TestCase):
    def test_ai_engine_has_no_direct_dlt_imports_or_endpoints(self) -> None:
        app_root = Path(__file__).resolve().parents[1] / "app"
        forbidden_patterns = [
            re.compile(r"^\s*(from\s+web3\s+import|import\s+web3)\b", re.MULTILINE),
            re.compile(r"^\s*(from\s+ethers\s+import|import\s+ethers)\b", re.MULTILINE),
            re.compile(r"besu", re.IGNORECASE),
            re.compile(r"json-rpc", re.IGNORECASE),
            re.compile(r"eth_(call|sendRawTransaction|getTransactionReceipt)", re.IGNORECASE),
        ]

        violations = []
        for py_file in app_root.rglob("*.py"):
            content = py_file.read_text(encoding="utf-8")
            for pattern in forbidden_patterns:
                if pattern.search(content):
                    violations.append(f"{py_file.relative_to(app_root.parent)} => {pattern.pattern}")

        self.assertEqual(
            violations,
            [],
            "AI engine must not call DLT/Besu directly. Violations: " + "; ".join(violations),
        )


if __name__ == "__main__":
    unittest.main()
