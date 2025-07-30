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

// Prompt user for new version
rl.question("Enter new version: ", (newVersion) => {
  console.log(`New version will be: ${newVersion}`);
  
  try {
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
    execSync(`git add package.json package-lock.json`, { stdio: "inherit" });
    execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
    console.log(`✅ Changes committed with message: "${commitMessage}"`);
    
    // Create Git tag
    console.log("🔄 Creating Git tag...");
    execSync(`git tag v${newVersion}`, { stdio: "inherit" });
    console.log(`✅ Tag v${newVersion} created successfully`);
    
    console.log("\n🎉 Release preparation completed successfully!");
    console.log("\n📋 Next steps to deploy:");
    console.log("   git push");
    console.log("   git push origin v" + newVersion);
    
  } catch (error) {
    console.error("❌ Error during release process:", error.message);
    process.exit(1);
  }
  
  rl.close();
});
