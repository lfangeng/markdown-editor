from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from app import DIRECTORIES_TO_COPY, FILES_TO_COPY


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare the GitHub Pages artifact directory.")
    parser.add_argument(
        "--output-dir",
        default="pages-artifact",
        help="Directory that will receive index.html and static assets.",
    )
    return parser.parse_args()


def prepare_pages_artifact(source_root: Path, output_dir: str) -> Path:
    target_root = Path(output_dir)
    if not target_root.is_absolute():
        target_root = source_root / target_root

    target_root = target_root.resolve()
    source_root = source_root.resolve()

    protected_paths = {source_root}
    protected_paths.update((source_root / name).resolve() for name in FILES_TO_COPY)
    protected_paths.update((source_root / name).resolve() for name in DIRECTORIES_TO_COPY)
    if target_root in protected_paths:
        raise ValueError(f"输出目录不能覆盖源码路径：{target_root}")

    if target_root.exists():
        shutil.rmtree(target_root)
    target_root.mkdir(parents=True, exist_ok=True)

    for file_name in FILES_TO_COPY:
        source_path = source_root / file_name
        if not source_path.is_file():
            raise FileNotFoundError(f"缺少 Pages 文件：{source_path}")
        shutil.copy2(source_path, target_root / file_name)

    for directory_name in DIRECTORIES_TO_COPY:
        source_directory = source_root / directory_name
        if not source_directory.is_dir():
            raise NotADirectoryError(f"缺少 Pages 目录：{source_directory}")
        shutil.copytree(source_directory, target_root / directory_name)

    return target_root


def main() -> None:
    args = parse_args()
    artifact_root = prepare_pages_artifact(Path(__file__).resolve().parent, args.output_dir)
    print(f"Prepared Pages artifact at {artifact_root}")


if __name__ == "__main__":
    main()
