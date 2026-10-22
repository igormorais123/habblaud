import { describe, expect, it } from 'vitest';
import { linkedFiles } from './deliveries';
import { checkFile, insideKnownFolder, pathProblem, slashPath } from './files';

describe('entregas no Windows', () => {
  it('slashPath: barras normais só no Windows', () => {
    expect(slashPath('C:\\Users\\ana\\p\\a.png', 'win32')).toBe('C:/Users/ana/p/a.png');
    expect(slashPath('/C:/Users/ana/a.png', 'win32')).toBe('C:/Users/ana/a.png');
    expect(slashPath('C:\\Users\\ana\\a.png', 'darwin')).toBe('C:\\Users\\ana\\a.png');
    expect(slashPath('/Users/ana/a.png', 'linux')).toBe('/Users/ana/a.png');
  });

  it('pathProblem: letra de disco é caminho absoluto, e os segredos continuam de fora', () => {
    expect(pathProblem('C:/Users/ana/p/relatorio.pdf')).toBeUndefined();
    for (const bad of ['C:/Users/ana/.ssh/x.png', 'C:/Users/ana/p/.env.png', 'C:/Users/ana/p/secret-plan.pdf', 'C:/a/../b.png', 'C:relativo.png']) {
      expect(pathProblem(bad), bad).toBeDefined();
    }
  });

  it('checkFile devolve o caminho real com barras normais', () => {
    const fs = { realpath: () => (process.platform === 'win32' ? 'C:\\Users\\ana\\a.png' : 'C:/Users/ana/a.png'), stat: () => ({ isFile: () => true, size: 10 }) };
    expect(checkFile('C:/Users/ana/a.png', fs)).toEqual({ path: 'C:/Users/ana/a.png', size: 10 });
  });

  it.runIf(process.platform === 'win32')('linkedFiles: caminhos C:\\, C:/, file:/// e relativos ao projeto', () => {
    const text = 'Pronto: [relatório](C:\\Users\\ana\\proj\\relatorio.pdf), [tela](file:///C:/Users/ana/proj/tela.png), [b](docs/b.png) e C:\\Users\\ana\\proj\\print.png. Não: [x](https://x.com/a.png) e C:\\Users\\ana\\.ssh\\k.png';
    expect(linkedFiles(text, 'C:\\Users\\ana\\proj')).toEqual([
      'C:/Users/ana/proj/relatorio.pdf',
      'C:/Users/ana/proj/tela.png',
      'C:/Users/ana/proj/docs/b.png',
      'C:/Users/ana/proj/print.png',
    ]);
  });

  it.runIf(process.platform === 'win32')('insideKnownFolder: pasta codificada como o Claude Code faz no Windows', () => {
    const known = new Set(['C:\\h\\.claude\\projects\\C--Users-ana-loja']);
    const opts = { accountDirs: ['C:\\h\\.claude'], roots: ['C:\\Temp\\claude'], exists: (p: string) => known.has(p) };
    expect(insideKnownFolder('C:/Users/ana/loja/docs/print.png', opts)).toBe(true);
    expect(insideKnownFolder('C:/Temp/claude/scratch/tela.png', opts)).toBe(true);
    expect(insideKnownFolder('C:/Users/ana/outra/a.png', opts)).toBe(false);
  });
});
