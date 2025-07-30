#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to collect changelog entries
const collectChangelogEntries = (newVersion) => {
  return new Promise((resolve) => {
    console.log("\n📝 Please enter changelog entries (one per line, type 'done' when finished):");
    const changelogEntries = [];
    
    const askForEntry = () => {
      rl.question("  - ", (entry) => {
        if (entry.toLowerCase() === 'done') {
          if (changelogEntries.length === 0) {
            console.log("❌ At least one changelog entry is required!");
            askForEntry();
            return;
          }
          resolve(changelogEntries);
        } else if (entry.trim()) {
          changelogEntries.push(entry.trim());
          askForEntry();
        } else {
          askForEntry();
        }
      });
    };
    
    askForEntry();
  });
};

// Function to update CHANGELOG.md
const updateChangelog = (newVersion, changelogEntries) => {
  const changelogPath = join(__dirname, "..", "CHANGELOG.md");
  const currentContent = readFileSync(changelogPath, "utf-8");
  
  const newEntry = `### ${newVersion}\n\n${changelogEntries.map(entry => `- ${entry}`).join('\n')}\n\n`;
  const updatedContent = newEntry + currentContent;
  
  writeFileSync(changelogPath, updatedContent);
  console.log(`✅ CHANGELOG.md updated with version ${newVersion}`);
};

// Main release process
const runRelease = async () => {
  try {
    // Check if there are any staged changes
    console.log("🔍 Checking for staged changes...");
    try {
      const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" }).trim();
      if (stagedFiles) {
        console.error("❌ There are files already staged for commit!");
        console.error("Please unstage them first with: git reset");
        console.error("Staged files:");
        stagedFiles.split('\n').forEach(file => console.error(`  - ${file}`));
        rl.close();
        process.exit(1);
      }
      console.log("✅ No staged changes found, proceeding...");
    } catch (error) {
      // If git diff fails, assume no staged changes
      console.log("✅ No staged changes found, proceeding...");
    }

    // Get new version from user
    const newVersion = await new Promise((resolve) => {
      rl.question("Enter new version: ", resolve);
    });
    
    console.log(`New version will be: ${newVersion}`);

    // Validate semantic versioning format
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(newVersion)) {
      console.error("❌ Invalid version format! Please use semantic versioning (e.g., 1.2.3)");
      rl.close();
      process.exit(1);
    }

    // Compare versions
    const currentParts = currentVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);

    let isHigher = false;
    for (let i = 0; i < 3; i++) {
      if (newParts[i] > currentParts[i]) {
        isHigher = true;
        break;
      } else if (newParts[i] < currentParts[i]) {
        break;
      }
    }

    if (!isHigher) {
      console.error(`❌ New version ${newVersion} is not higher than current version ${currentVersion}!`);
      rl.close();
      process.exit(1);
    }

    console.log(`✅ Version ${newVersion} is valid and higher than current version ${currentVersion}`);

    // Collect changelog entries
    const changelogEntries = await collectChangelogEntries(newVersion);

    // Check if tag already exists
    console.log("🔍 Checking if tag already exists...");
    try {
      execSync(`git rev-parse v${newVersion}`, { stdio: "pipe" });
      console.error(`❌ Tag v${newVersion} already exists! Please choose a different version.`);
      rl.close();
      process.exit(1);
    } catch (tagError) {
      // Tag doesn't exist, which is what we want
      console.log(`✅ Tag v${newVersion} does not exist, proceeding...`);
    }

    // Update CHANGELOG.md
    updateChangelog(newVersion, changelogEntries);

    // Update package.json with new version
    packageJson.version = newVersion;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
    console.log(`✅ Version updated to ${newVersion} in package.json`);

    // Run npm install to update package-lock.json
    console.log("🔄 Running npm install to update package-lock.json...");
    execSync("npm install", { stdio: "inherit" });
    console.log("✅ package-lock.json updated");

    // Commit the changes
    console.log("🔄 Committing changes...");
    const commitMessage = `build(${newVersion}): version bump`;
    execSync(`git add package.json package-lock.json CHANGELOG.md`, { stdio: "inherit" });
    execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
    console.log(`✅ Changes committed with message: "${commitMessage}"`);

    // Create Git tag
    console.log("🔄 Creating Git tag...");
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    console.log(`✅ Tag v${newVersion} created successfully`);

    console.log("\n🎉 Release preparation completed successfully!");
    console.log("\n📋 Next steps to release:");
    console.log("   git push");
    console.log("   git push origin v" + newVersion);

  } catch (error) {
    console.error("❌ Error during release process:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Start the release process
runRelease();
