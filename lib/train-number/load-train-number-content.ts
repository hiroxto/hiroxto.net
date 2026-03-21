import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const loadTrainNumberContent = async (fileName: string): Promise<string> => {
    const contentPath = path.join(process.cwd(), 'lib', 'train-number', 'content', fileName);
    return await readFile(contentPath, 'utf-8');
};
