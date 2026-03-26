#!/usr/bin/env node

/**
 * CRAP — Change Risk Analysis and Predictions
 *
 * Formula: CRAP(m) = CC(m)² × (1 − cov(m))³ + CC(m)
 *
 * Where CC = cyclomatic complexity and cov = test coverage (0–1).
 *
 * Inspired by https://github.com/unclebob/crap4java
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import ts from 'typescript';
import chalk from 'chalk';

const DEFAULT_THRESHOLD = 30;
const COVERAGE_DIR = '.test/coverage';
const COVERAGE_FILE = join(COVERAGE_DIR, 'coverage-final.json');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const threshold = getFlag('--threshold', DEFAULT_THRESHOLD);
const skipCoverage = args.includes('--skip-coverage');
const showAll = args.includes('--all');
const cwd = process.cwd();

// ---------------------------------------------------------------------------
// 1. Generate coverage (unless --skip-coverage)
// ---------------------------------------------------------------------------

if (!skipCoverage) {
  console.log(chalk.cyan('Running tests with coverage…\n'));
  try {
    execSync(
      'npx vitest run --coverage --coverage.reporter=json --coverage.reporter=text',
      { stdio: 'inherit', cwd },
    );
  } catch {
    console.error(chalk.red('\nTests failed — coverage may be incomplete.\n'));
  }
  console.log();
}

if (!existsSync(COVERAGE_FILE)) {
  console.error(
    chalk.red(`Coverage file not found: ${COVERAGE_FILE}`),
    '\nRun without --skip-coverage first.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Parse coverage data (istanbul JSON format)
// ---------------------------------------------------------------------------

const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));

// ---------------------------------------------------------------------------
// 3. Compute cyclomatic complexity per function via TypeScript AST
// ---------------------------------------------------------------------------

/**
 * Returns cyclomatic complexity of a function-like node.
 * Starts at 1, increments for each branching construct.
 */
function computeComplexity(node) {
  let complexity = 1;

  function walk(n) {
    switch (n.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
        complexity++;
        break;
      case ts.SyntaxKind.BinaryExpression:
        if (
          n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          n.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          complexity++;
        }
        break;
    }

    // Don't recurse into nested function-likes — they get their own score.
    if (
      n !== node &&
      (ts.isFunctionDeclaration(n) ||
        ts.isFunctionExpression(n) ||
        ts.isArrowFunction(n) ||
        ts.isMethodDeclaration(n) ||
        ts.isGetAccessorDeclaration(n) ||
        ts.isSetAccessorDeclaration(n) ||
        ts.isConstructorDeclaration(n))
    ) {
      return;
    }

    ts.forEachChild(n, walk);
  }

  ts.forEachChild(node, walk);
  return complexity;
}

/**
 * Extract all function-level entries from a source file:
 * { name, startLine, endLine, complexity }
 */
function extractFunctions(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const functions = [];

  function visit(node) {
    let name = null;
    let isFunctionLike = false;

    if (ts.isFunctionDeclaration(node)) {
      name = node.name?.getText(sourceFile) ?? '(anonymous)';
      isFunctionLike = true;
    } else if (
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    ) {
      name = node.name?.getText(sourceFile) ?? '(anonymous)';
      isFunctionLike = true;
    } else if (ts.isConstructorDeclaration(node)) {
      name = 'constructor';
      isFunctionLike = true;
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      // Try to derive name from parent variable declaration
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent)) {
        name = parent.name.getText(sourceFile);
      } else if (ts.isPropertyAssignment(parent)) {
        name = parent.name.getText(sourceFile);
      } else if (ts.isPropertyDeclaration(parent)) {
        name = parent.name.getText(sourceFile);
      } else {
        name = '(anonymous)';
      }
      isFunctionLike = true;
    }

    if (isFunctionLike) {
      const startLine =
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1;
      const endLine =
        sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      const complexity = computeComplexity(node);
      functions.push({ name, startLine, endLine, complexity });
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return functions;
}

// ---------------------------------------------------------------------------
// 4. Compute per-function coverage from istanbul data
// ---------------------------------------------------------------------------

/**
 * Given istanbul file coverage and a function's line range,
 * compute the fraction of statements covered (0–1).
 */
function computeFunctionCoverage(fileCoverage, startLine, endLine) {
  const { statementMap, s } = fileCoverage;
  let total = 0;
  let covered = 0;

  for (const [id, loc] of Object.entries(statementMap)) {
    if (loc.start.line >= startLine && loc.end.line <= endLine) {
      total++;
      if (s[id] > 0) covered++;
    }
  }

  if (total === 0) return null; // no statements tracked
  return covered / total;
}

// ---------------------------------------------------------------------------
// 5. CRAP score
// ---------------------------------------------------------------------------

function crapScore(complexity, coverage) {
  if (coverage === null) return null;
  const uncovered = 1 - coverage;
  return (
    complexity * complexity * uncovered * uncovered * uncovered + complexity
  );
}

// ---------------------------------------------------------------------------
// 6. Analyse all covered files
// ---------------------------------------------------------------------------

const results = [];

for (const [absPath, fileCov] of Object.entries(coverageData)) {
  const relPath = relative(cwd, absPath);

  // Skip test files and declaration files
  if (relPath.includes('.test.') || relPath.endsWith('.d.ts')) continue;

  if (!existsSync(absPath)) continue;

  let functions;
  try {
    functions = extractFunctions(absPath);
  } catch {
    continue; // skip unparseable files
  }

  for (const fn of functions) {
    const coverage = computeFunctionCoverage(fileCov, fn.startLine, fn.endLine);
    const score = crapScore(fn.complexity, coverage);

    results.push({
      file: relPath,
      name: fn.name,
      line: fn.startLine,
      complexity: fn.complexity,
      coverage,
      crap: score,
    });
  }
}

// Sort: highest CRAP first, nulls last
results.sort((a, b) => {
  if (a.crap === null && b.crap === null) return 0;
  if (a.crap === null) return 1;
  if (b.crap === null) return -1;
  return b.crap - a.crap;
});

// ---------------------------------------------------------------------------
// 7. Report
// ---------------------------------------------------------------------------

const filtered = showAll ? results : results.filter((r) => r.crap !== null);

if (filtered.length === 0) {
  console.log(chalk.yellow('No functions found in coverage data.'));
  process.exit(0);
}

// Column widths
const COL = { file: 40, name: 25, line: 5, cc: 4, cov: 7, crap: 8 };

function pad(str, len) {
  return str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
}

function rpad(str, len) {
  return str.length > len ? str.slice(0, len - 1) + '…' : str.padStart(len);
}

console.log(
  chalk.bold(
    `${pad('File', COL.file)} ${pad('Function', COL.name)} ${rpad('Line', COL.line)} ${rpad('CC', COL.cc)} ${rpad('Cov %', COL.cov)} ${rpad('CRAP', COL.crap)}`,
  ),
);
console.log(
  '─'.repeat(COL.file + COL.name + COL.line + COL.cc + COL.cov + COL.crap + 5),
);

let failCount = 0;

for (const r of filtered) {
  const covStr =
    r.coverage !== null ? `${(r.coverage * 100).toFixed(1)}%` : 'N/A';
  const crapStr = r.crap !== null ? r.crap.toFixed(1) : 'N/A';
  const exceeds = r.crap !== null && r.crap > threshold;
  if (exceeds) failCount++;

  const colorFn = exceeds
    ? chalk.red
    : r.crap !== null && r.crap > threshold * 0.7
      ? chalk.yellow
      : chalk.white;

  console.log(
    colorFn(
      `${pad(r.file, COL.file)} ${pad(r.name, COL.name)} ${rpad(String(r.line), COL.line)} ${rpad(String(r.complexity), COL.cc)} ${rpad(covStr, COL.cov)} ${rpad(crapStr, COL.crap)}`,
    ),
  );
}

console.log(
  '─'.repeat(COL.file + COL.name + COL.line + COL.cc + COL.cov + COL.crap + 5),
);
console.log(
  `\n${chalk.bold('Total functions:')} ${filtered.length}   ${chalk.bold('Threshold:')} ${threshold}   ${chalk.bold('Exceeding:')} ${failCount > 0 ? chalk.red(failCount) : chalk.green(failCount)}`,
);

if (failCount > 0) {
  console.log(
    chalk.red(
      `\n✗ ${failCount} function(s) exceed CRAP threshold of ${threshold}\n`,
    ),
  );
  process.exit(2);
} else {
  console.log(
    chalk.green(
      `\n✓ All functions are within CRAP threshold of ${threshold}\n`,
    ),
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFlag(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx === -1) return defaultValue;
  const val = args[idx + 1];
  return val !== undefined ? Number(val) : defaultValue;
}
