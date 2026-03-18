from __future__ import annotations

import os
import shutil
import sys
import webbrowser
from pathlib import Path


FILES_TO_COPY = ("index.html", "styles.css", "script.js")
DIRECTORIES_TO_COPY = ("vendor",)


def get_bundle_root() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)

    return Path(__file__).resolve().parent


def get_install_root() -> Path:
    local_appdata = Path(os.environ.get("LOCALAPPDATA", Path.home()))
    return local_appdata / "MarkdownEditor"


def sync_assets(source_root: Path, install_root: Path) -> None:
    install_root.mkdir(parents=True, exist_ok=True)

    for file_name in FILES_TO_COPY:
        shutil.copy2(source_root / file_name, install_root / file_name)

    for directory_name in DIRECTORIES_TO_COPY:
        source_directory = source_root / directory_name
        target_directory = install_root / directory_name

        if target_directory.exists():
            shutil.rmtree(target_directory)

        shutil.copytree(source_directory, target_directory)


def main() -> None:
    bundle_root = get_bundle_root()
    install_root = get_install_root()
    sync_assets(bundle_root, install_root)

    index_file = install_root / "index.html"
    if not webbrowser.open(index_file.as_uri()):
        raise RuntimeError(f"无法打开浏览器：{index_file}")


if __name__ == "__main__":
    main()
