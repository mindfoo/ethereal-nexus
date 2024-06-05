import { EmitFile, OutputBundle, ParseAst, ProgramNode, RenderedChunk } from 'rollup';
import MagicString from 'magic-string';
import { simple } from 'acorn-walk';
import { createHash } from 'crypto';
import fs from 'node:fs';
import path from 'node:path';

export function createClientCode(code: string, name: string, id: string, ast: ProgramNode) {
  let magic = new MagicString(code);
  let importsNexus = false;
  let hasSchema = false

  simple(ast, {
    VariableDeclaration(node) {
      for (const declaration of node.declarations) {
        if (declaration.id.type === 'Identifier' && declaration.id.name === 'schema' && declaration.init?.type === 'CallExpression') {
          hasSchema = true;
        }
      }
    },
    ImportDeclaration(node) {
      if (node.type === 'ImportDeclaration') {
        const { source: { value, start, end } } = node;

        if (value === '@ethereal-nexus/core') {
          const last = node.specifiers.pop();
          if (last?.type === 'ImportSpecifier') {
            magic.appendLeft(last.end, `,\n webcomponent`);
          }
          importsNexus = true;
        } else if (typeof value === 'string' && value.startsWith('.')) {
          const resolvedPath = path.join(path.dirname(id), value);
          magic.update(start + 1, end - 1, resolvedPath);
        }
      }
    },
    ExportNamedDeclaration(node) {
      if(node.declaration?.type === 'VariableDeclaration' && node.declaration){
        for(const declaration of node.declaration.declarations) {
          if(declaration.id.type === 'Identifier' && declaration.id.name === name) {
            if(!importsNexus) {
              magic.prepend(`import { webcomponent } from "@ethereal-nexus/core";\n`);
            }
            magic.append(`${name}.displayName = '${name}';\n`)
            magic.append(`webcomponent(${hasSchema ? 'schema' : ''})(${name});\n`)
          }
        }
      }
    }
  });

  return magic;
}

export function bundleClient(code: string, exposed: Map<string, string>, id: string, ast: ProgramNode, name: string, emitFile: EmitFile) {
  const clientCode = createClientCode(code, exposed.get(id)!, id, ast);
  fs.writeFileSync(`dist/tmp/__etherealHelper__${name}`, clientCode.toString());

  const hash = createHash('sha256')
    .update(code)
    .digest('hex')
    .slice(0, 16);

  emitFile({
    type: 'chunk',
    fileName: `.ethereal/${name}/${hash}-index.js`,
    id: `dist/tmp/__etherealHelper__${name}`
  });
}

export function copyChunkFiles(bundle: OutputBundle) {
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === 'chunk' && chunk.facadeModuleId?.includes('__etherealHelper__')) {
      for (const imports of chunk.imports) {
        const importPath = path.parse(imports);
        const chunkPath = path.dirname(chunk.preliminaryFileName);

        fs.copyFileSync(`./dist/${imports}`, `./dist/${chunkPath}/${importPath.base}`);
      }
    }
  }
}

export function adjustChunkImport(chunk: RenderedChunk, code: string, parse: ParseAst) {
  if (chunk.facadeModuleId?.includes('__etherealHelper__')) {
    const ast = parse(code);
    const magic = new MagicString(code);

    simple(ast, {
      ImportDeclaration(node) {
        const { value, start, end } = node.source;
        if (value && typeof value === 'string') {
          magic.update(start + 1, end - 1, `./${value.split('/').pop()}`);
        }
      }
    });

    return magic.toString();
  }

  return null;
}