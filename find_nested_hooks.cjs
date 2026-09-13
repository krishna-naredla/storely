const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src');

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    function visitNode(node, isInsideFunctionComponentOrHook, depth) {
        let newIsInside = isInsideFunctionComponentOrHook;
        let newDepth = depth;

        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
            newDepth++;
            let funcName = '';
            if (ts.isFunctionDeclaration(node) && node.name) funcName = node.name.text;
            if (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) funcName = node.parent.name.text;
            
            if (funcName && (funcName.startsWith('use') || /^[A-Z]/.test(funcName))) {
                newIsInside = true;
                newDepth = 1; // reset depth for components/hooks
            }
        }

        if (ts.isCallExpression(node)) {
            const exp = node.expression;
            if (ts.isIdentifier(exp) && (exp.text.startsWith('use') || exp.text === 'useContext')) {
                if (!newIsInside || newDepth > 1) { 
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    console.log(`Hook call found in ${file}:${line + 1}:${character + 1} - ${exp.text} (isInside: ${newIsInside}, depth: ${newDepth})`);
                }
            }
        }

        ts.forEachChild(node, child => visitNode(child, newIsInside, newDepth));
    }
    
    visitNode(sourceFile, false, 0);
}
