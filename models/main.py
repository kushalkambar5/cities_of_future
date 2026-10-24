"""Root entrypoint for Cities of the Future - ML Detection Service.

Run the FastAPI server:
    python main.py
    # or
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Or run CLI mode directly:
    python main.py --input sample.mp4 --output out.mp4 --report report.csv
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.api.app import app
from src.config import settings

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cities of the Future ML Service")
    parser.add_argument("--server", action="store_true", default=False, help="Run FastAPI server")
    parser.add_argument("--host", default=settings.HOST, help="Server host")
    parser.add_argument("--port", type=int, default=settings.PORT, help="Server port")
    parser.add_argument("--reload", action="store_true", default=False, help="Enable auto-reload")
    parser.add_argument("--input", type=str, help="Run batch pipeline directly on an input file")
    parser.add_argument("--output", type=str, help="Path to save annotated output file")
    parser.add_argument("--report", type=str, help="Path to save CSV report")

    args = parser.parse_args()

    if args.input:
        # CLI Pipeline execution mode
        from scripts.run_local import run_local_pipeline
        run_local_pipeline(
            input_path=args.input,
            output_path=args.output,
            report_path=args.report,
        )
    else:
        # FastAPI Server mode
        import uvicorn
        print(f"Starting {settings.APP_NAME} on http://{args.host}:{args.port}")
        uvicorn.run("src.api.app:app", host=args.host, port=args.port, reload=args.reload)
