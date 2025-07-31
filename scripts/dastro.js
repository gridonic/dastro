#!/usr/bin/env node

import {execSync} from "child_process";

const command = process.argv[2];

switch (command) {
    case "link":
        execSync("npm link dastro", {stdio: "inherit"});
        break;
    case "unlink":
        execSync("npm unlink dastro --no-save", {stdio: "inherit"});
        execSync("npm ci", {stdio: "inherit"});
}
