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

// Helper function to get user input with default value
function askQuestionWithDefault(question, defaultValue) {
    return new Promise((resolve) => {
        rl.question(`${question} (${defaultValue}): `, (answer) => {
            const trimmedAnswer = answer.trim();
            resolve(trimmedAnswer || defaultValue);
        });
    });
}

// Helper function to convert readable name to repository name
function inferRepositoryName(readableName) {
    return readableName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
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

        // Get readable name from user
        const readableName = await askQuestion("Enter a readable name for your project (e.g., 'Gridonic Website'): ");
        
        // Infer repository name from readable name
        const inferredRepoName = inferRepositoryName(readableName);
        console.log(`\n📝 Inferred repository name: ${inferredRepoName}`);
        
        // Get final repository name from user (with default)
        let projectName;
        let validationError;

        do {
            projectName = await askQuestionWithDefault("Repository name", inferredRepoName);
            validationError = validateProjectName(projectName);

            if (validationError) {
                console.log(`❌ ${validationError}\n`);
            }
        } while (validationError);

        // Get DatoCMS token from user
        console.log("\n🔑 DatoCMS Configuration");
        const datocmsToken = await askQuestionWithDefault(
            "Enter your DatoCMS Content Delivery API token (leave blank to use boilerplate token)",
            ""
        );

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

        // Update IntelliJ project name
        console.log("🔧 Updating IntelliJ project configuration...");
        const ideaPath = join(projectPath, ".idea");
        if (existsSync(ideaPath)) {
            // Update .idea/.name file
            const ideaNamePath = join(ideaPath, ".name");
            if (existsSync(ideaNamePath)) {
                writeFileSync(ideaNamePath, readableName);
            }

            // Update .idea/modules.xml
            const modulesXmlPath = join(ideaPath, "modules.xml");
            if (existsSync(modulesXmlPath)) {
                let modulesXml = readFileSync(modulesXmlPath, "utf8");
                // Replace the old project name with the new one in the filepath and fileurl
                modulesXml = modulesXml.replace(/Astro Boilerplate/g, readableName);
                writeFileSync(modulesXmlPath, modulesXml);
            }

            // Rename the .iml file
            const oldImlPath = join(ideaPath, "Astro Boilerplate.iml");
            const newImlPath = join(ideaPath, `${readableName}.iml`);
            if (existsSync(oldImlPath)) {
                execSync(`mv "${oldImlPath}" "${newImlPath}"`, { stdio: "inherit" });
            }
        }

        // Update package.json with a new project name
        console.log("📝 Updating package.json...");
        const packageJsonPath = join(projectPath, "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        packageJson.name = projectName;
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Update .env.example with DatoCMS token if provided
        if (datocmsToken.trim()) {
            console.log("📝 Updating DatoCMS token in .env.example...");
            const envExamplePath = join(projectPath, ".env.example");
            if (existsSync(envExamplePath)) {
                let envContent = readFileSync(envExamplePath, "utf8");
                envContent = envContent.replace(/DATO_CMS_TOKEN=.*/, `DATO_CMS_TOKEN=${datocmsToken}`);
                writeFileSync(envExamplePath, envContent);
            }
        }

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
