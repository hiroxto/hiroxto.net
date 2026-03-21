import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDirPath = path.resolve(__dirname, '../lib/train-number/content');

// 生成対象のファイル名はこの配列で管理する。
// 新しい改正版を追加するときは、対応する content/*.md を追加し、この配列へ同じファイル名を追記する。
const fileNames = ['2018-03-17', '2019-03-16', '2020-03-14', '2021-03-13'] as const;

const normalizeLineEndings = (value: string): string => value.replaceAll('\r\n', '\n');

const createGeneratedSource = (markdownContent: string, sourceFileName: string): string => {
    const normalizedContent = normalizeLineEndings(markdownContent);
    const hasTrailingNewline = normalizedContent.endsWith('\n');
    const lines = (hasTrailingNewline ? normalizedContent.slice(0, -1) : normalizedContent).split('\n');
    const formattedLines = lines.map((line) => `    ${JSON.stringify(line)},`).join('\n');
    const suffixLine = hasTrailingNewline ? "].join('\\n')}\\n`;" : "].join('\\n')}`;";

    return [
        `// This file is generated from ${sourceFileName}. Do not edit directly.`,
        'export const content = `${[',
        formattedLines,
        suffixLine,
        '',
    ].join('\n');
};

const main = async (): Promise<void> => {
    for (const fileName of fileNames) {
        const markdownFilePath = path.join(contentDirPath, `${fileName}.md`);
        const generatedFilePath = path.join(contentDirPath, `${fileName}.ts`);
        const markdownContent = await readFile(markdownFilePath, 'utf8');
        const generatedSource = createGeneratedSource(markdownContent, `${fileName}.md`);

        await writeFile(generatedFilePath, generatedSource, 'utf8');
    }
};

await main();
