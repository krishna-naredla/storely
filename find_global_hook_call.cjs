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

    function visitNode(node, currentFunctionName) {
        let funcName = currentFunctionName;
        
        if (ts.isFunctionDeclaration(node) && node.name) {
            funcName = node.name.text;
        } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
            funcName = node.name.text;
        }
        
        if (ts.isCallExpression(node)) {
            const exp = node.expression;
            if (ts.isIdentifier(exp) && (exp.text.startsWith('use') || exp.text === 'useContext' || exp.text === 'useLanguage' || exp.text === 'useAuth' || exp.text === 'useStorefrontCart')) {
                if (funcName && !funcName.startsWith('use') && !/^[A-Z]/.test(funcName)) {
                    console.log(`Hook called in non-hook/non-component function: ${funcName} in ${file} at ${exp.text}`);
                } else if (!funcName) {
                    console.log(`Hook called at top-level in ${file} at ${exp.text}`);
                }
            }
        }

        ts.forEachChild(node, child => visitNode(child, funcName));
    }
    visitNode(sourceFile, null);
}
