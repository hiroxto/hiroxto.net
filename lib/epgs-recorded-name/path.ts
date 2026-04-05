export type SeasonName = '冬アニメ' | '春アニメ' | '夏アニメ' | '秋アニメ' | 'アニメ以外';
export type SeasonValue = '01_winter' | '02_spring' | '03_summer' | '04_autumn' | '10_other';

interface Season {
    name: SeasonName;
    value: SeasonValue;
    isCurrentSeason: (month: number) => boolean;
}

export const seasonsList: Season[] = [
    {
        name: '冬アニメ',
        value: '01_winter',
        // 準備期間を考慮して放送月より1月前からの3ヶ月分を入れる
        isCurrentSeason: (month) => [12, 1, 2].includes(month),
    },
    {
        name: '春アニメ',
        value: '02_spring',
        isCurrentSeason: (month) => [3, 4, 5].includes(month),
    },
    {
        name: '夏アニメ',
        value: '03_summer',
        isCurrentSeason: (month) => [6, 7, 8].includes(month),
    },
    {
        name: '秋アニメ',
        value: '04_autumn',
        isCurrentSeason: (month) => [9, 10, 11].includes(month),
    },
    {
        name: 'アニメ以外',
        value: '10_other',
        isCurrentSeason: () => false,
    },
];

export const getDefaultSeason = (month: number): SeasonValue => {
    const currentSeason = seasonsList.find((season) => season.isCurrentSeason(month));

    return currentSeason?.value ?? seasonsList[0].value;
};

interface BuildRecordedPathParams {
    year: string;
    season: SeasonValue;
    isUnclassifiable: boolean;
    isRepeat: boolean;
    programName: string;
}

export const buildRecordedPath = ({
    year,
    season,
    isUnclassifiable,
    isRepeat,
    programName,
}: BuildRecordedPathParams): string => {
    const name = isUnclassifiable ? '10_other' : `${isRepeat ? 'repeat_' : ''}${programName}`;

    return [year, season, name].join('/');
};
