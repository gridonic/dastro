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
        break;
    case "upgrade":
        const command = `🔄 Running command: npm install dastro@github:gridonic/dastro#${getLatestRemoteVersionTag()}`;
        execSync(command, {stdio: "inherit"});
        console.log(`\n✅ Upgraded to latest version: ${getLatestRemoteVersionTag()}`);
        break;
    default:
        console.log("Usage: dastro <command>");
        console.log("Commands:");
        console.log("  link - link the local dastro package");
        console.log("  unlink - unlink the local dastro package");
        console.log("  upgrade - upgrade to the latest version of the dastro package");
        break;
}


function getLatestRemoteVersionTag() {
    const remoteTags = execSync("git ls-remote --tags git@github.com:gridonic/dastro.git", { encoding: "utf8" });
    const versionTags = remoteTags
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            const parts = line.split('\t');
            return parts[1]?.replace('refs/tags/', '');
        })
        .filter(tag => tag && tag.match(/^v\d+\.\d+\.\d+$/))
        .sort((a, b) => {
            const versionA = a.replace('v', '').split('.').map(Number);
            const versionB = b.replace('v', '').split('.').map(Number);
            for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
                const numA = versionA[i] || 0;
                const numB = versionB[i] || 0;
                if (numA !== numB) return numB - numA;
            }
            return 0;
        });

    if (versionTags.length === 0) {
        throw new Error("No valid version tags found, please update manually: npm install dastro@github:gridonic/dastro#vX.Y.Z");
    }

    return versionTags[0];
}
