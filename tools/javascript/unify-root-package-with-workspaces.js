#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const rootPackage = require(path.join(process.cwd(), 'package.json'));

const globModule = require('glob');

const workspacePath = path.join(process.cwd(), 'pnpm-workspace.yaml');
const workspaceContent = fs.readFileSync(workspacePath, 'utf8');
const workspace = yaml.load(workspaceContent);
const packages = (workspace.packages || []).map(pkg => `${pkg}/package.json`);

const files = globModule.globSync(packages);

files.forEach(packagePath => {
  const package = require(path.resolve(packagePath));

  ['dependencies', 'devDependencies'].forEach(depType => {
    Object.keys(package[depType] || {}).forEach(dependency => {
      if (rootPackage[depType][dependency]) {
        package[depType][dependency] = rootPackage[depType][dependency];
      }
    });
  });

  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2).concat('\n'));
});
