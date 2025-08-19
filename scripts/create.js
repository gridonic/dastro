#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { createInterface } from "readline";

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to get user input
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Helper function to validate the project name
function validateProjectName(name) {
    if (!name) {
        return "Project name cannot be empty";
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
        return "Project name can only contain letters, numbers, hyphens, and underscores";
    }

    if (existsSync(name)) {
        return `Directory '${name}' already exists`;
    }

    return null;
}

async function createProject() {
    try {
        console.log("🚀 Welcome to Dastro Project Creator!\n");

        // Get project name from user
        let projectName;
        let validationError;

        do {
            projectName = await askQuestion("Enter the name for your new project: ");
            validationError = validateProjectName(projectName);

            if (validationError) {
                console.log(`❌ ${validationError}\n`);
            }
        } while (validationError);

        console.log(`\n📁 Creating project: ${projectName}\n`);

        // Clone the repository template
        console.log("📥 Cloning repository template...");
        const templateRepo = "git@github.com:gridonic/astro-boilerplate.git";

        execSync(`git clone ${templateRepo} ${projectName}`, {
            stdio: "inherit",
            cwd: process.cwd()
        });

        // Remove the.git directory to start fresh
        console.log("🧹 Cleaning up repository...");
        execSync(`rm -rf ${projectName}/.git`, { stdio: "inherit" });

        // Navigate to the project directory
        const projectPath = join(process.cwd(), projectName);

        // Update package.json with a new project name
        console.log("📝 Updating package.json...");
        const packageJsonPath = join(projectPath, "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        packageJson.name = projectName;
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Copy .env.example to .env
        console.log("📋 Setting up environment file...");
        const envExamplePath = join(projectPath, ".env.example");
        const envPath = join(projectPath, ".env");
        if (existsSync(envExamplePath)) {
            execSync(`cp "${envExamplePath}" "${envPath}"`, {
                stdio: "inherit",
                cwd: projectPath
            });
        }

        // Install dependencies
        console.log("📦 Installing dependencies...");
        execSync("npm install", {
            stdio: "inherit",
            cwd: projectPath
        });

        // Initialize git repository
        console.log("🔧 Initializing git repository...");
        execSync("git init", {
            stdio: "inherit",
            cwd: projectPath
        });
        execSync("git add .", {
            stdio: "inherit",
            cwd: projectPath
        });
        execSync('git commit -m "Initial commit"', {
            stdio: "inherit",
            cwd: projectPath
        });

        console.log("\n✅ Project created successfully!");
        console.log(`\n📁 Project location: ${projectPath}`);
        console.log("\n🚀 Next steps:");
        console.log(`   cd ${projectName}`);
        console.log("   npm run dev");
        console.log("\n📚 Documentation: https://github.com/gridonic/dastro");

    } catch (error) {
        console.error("❌ Error creating project:", error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Export the function for use in dastro.js
export { createProject };
