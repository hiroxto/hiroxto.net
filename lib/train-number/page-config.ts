export interface TrainNumberPageEntry {
    slug: '2018-03-17' | '2019-03-16' | '2020-03-14' | '2021-03-13';
    title: string;
}

export const trainNumberPageEntries: TrainNumberPageEntry[] = [
    {
        slug: '2018-03-17',
        title: '2018年3月17日 改正',
    },
    {
        slug: '2019-03-16',
        title: '2019年3月16日 改正',
    },
    {
        slug: '2020-03-14',
        title: '2020年3月14日 改正',
    },
    {
        slug: '2021-03-13',
        title: '2021年3月13日 改正',
    },
] as const;

export const trainNumberIndexTitle = '列車番号メモ';
export const trainNumberIndexDescription =
    '入出場，車輪削正などの予定臨や，パターンが概ね決まっている臨工や臨単の列車番号のメモ．';
