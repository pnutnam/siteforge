# Hello CLI Tool Specification

## 1. Project Overview

- **Project name**: hello
- **Type**: Simple CLI tool
- **Core functionality**: Print "hello" to stdout and exit successfully
- **Target users**: Anyone running the tool

## 2. Feature

CLI command that outputs exactly "hello\n" to stdout and exits with code 0.

## 3. File to Create

**File**: `/home/nate/n8/hello.py`

```python
#!/usr/bin/env python3
print("hello")
```

## 4. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Running `python3 hello.py` produces "hello" on stdout | Run `python3 /home/nate/n8/hello.py` and pipe to `cat -A` — output must show `hello$` |
| 2 | Exit code is 0 | Run `python3 /home/nate/n8/hello.py; echo "exit code: $?"` — exit code must be 0 |
| 3 | No arguments required | Run `python3 /home/nate/n8/hello.py` with no arguments — must still print "hello" and exit 0 |

## 5. Out of Scope

- Help flag (`--help`, `-h`)
- Command-line arguments
- Error handling
- Multiple output formats
- Logging
