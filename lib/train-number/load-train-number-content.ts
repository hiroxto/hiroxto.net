import { content as content20180317 } from '@/lib/train-number/gen/2018-03-17';
import { content as content20190316 } from '@/lib/train-number/gen/2019-03-16';
import { content as content20200314 } from '@/lib/train-number/gen/2020-03-14';
import { content as content20210313 } from '@/lib/train-number/gen/2021-03-13';

const trainNumberContentMap = {
    '2018-03-17.md': content20180317,
    '2019-03-16.md': content20190316,
    '2020-03-14.md': content20200314,
    '2021-03-13.md': content20210313,
} as const;

export const loadTrainNumberContent = async (fileName: keyof typeof trainNumberContentMap): Promise<string> => {
    const content = trainNumberContentMap[fileName];

    return content;
};
