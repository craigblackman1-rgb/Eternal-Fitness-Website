import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { execSync } from "child_process";
// transpile TSX on the fly via next's swc? simpler: use esbuild if present
