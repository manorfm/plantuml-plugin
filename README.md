# PlantUML Plugin

[![CI](https://github.com/manorfm/plantuml-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/manorfm/plantuml-plugin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.80.0-007ACC?logo=visualstudiocode)](https://code.visualstudio.com/)

Edit and preview [PlantUML](https://plantuml.com/) diagrams in Visual Studio Code—**code**, **split** (code + diagram), or **diagram only** in one tab—with live preview and export.

**Tests:** `npm test` (Extension Host). `npm run test:coverage:unit` (Node + c8). See [`docs/testing.md`](docs/testing.md).

## Features

- Live diagram preview (SVG); drag to pan; **Ctrl/Cmd + mouse wheel** zooms toward the cursor (plain wheel scrolls)  
- Export to **PNG** or **SVG**  
- Optional refresh while you type  
- PlantUML syntax highlighting and **Format Document**  
- Local `!include` file resolution  

## Getting started

1. Open a `.puml` (or `.plantuml`) file.  
2. Use the Command Palette (**Preview PlantUML**) or the editor toolbar to switch view modes.  

Configure the PlantUML server under **Settings** → search **PlantUML Plugin** (default uses the public demo server).

## Privacy

Diagram source is sent to the **server URL** you configure. Use a **local or private** server for sensitive content.

## License

MIT — see the repository.

**Issues & source:** [GitHub](https://github.com/manorfm/plantuml-plugin)
