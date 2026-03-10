'use client';

import {
    Button,
    Checkbox,
    Code,
    Grid,
    List,
    ListItem,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';

type SeasonName = '冬アニメ' | '春アニメ' | '夏アニメ' | '秋アニメ' | 'アニメ以外';
type SeasonValue = '01_winter' | '02_spring' | '03_summer' | '04_autumn' | '10_other';

interface Season {
    name: SeasonName;
    value: SeasonValue;
    isCurrentSeason: (month: number) => boolean;
}

const seasonsList: Season[] = [
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

const currentMonth = new Date().getMonth() + 1;
const currentSeasonIndex = seasonsList.map((season) => season.isCurrentSeason(currentMonth)).indexOf(true);
const defaultSeason = seasonsList[currentSeasonIndex === -1 ? 0 : currentSeasonIndex].value;

export function EpgsRecordedNamePage() {
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [season, setSeason] = useState<SeasonValue>(defaultSeason);
    const [isUnclassifiable, setIsUnclassifiable] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [programName, setProgramName] = useState('');

    const name = useMemo(() => {
        if (isUnclassifiable) {
            return '10_other';
        }
        const prefix = isRepeat ? 'repeat_' : '';
        return `${prefix}${programName}`;
    }, [isRepeat, isUnclassifiable, programName]);

    const output = useMemo(() => [year, season, name].join('/'), [name, season, year]);

    const copyOutput = () => {
        navigator.clipboard
            .writeText(output)
            .then(() => {
                alert('Copied!');
            })
            .catch((error) => {
                console.error(error);
            });
    };

    return (
        <SiteSubpageFrame items={[{ label: 'ツール一覧', href: '/tools' }, { label: '録画サーバーの保存先のパスを生成' }]}>
            <Stack gap="xl">
                <section>
                    <Title order={1}>録画サーバーの保存先のパスを生成</Title>
                </section>

                <section>
                    <Stack gap="md">
                        <Title order={2}>設定</Title>

                        <Grid>
                            <Grid.Col span={{ base: 12, xl: 2 }}>
                                <TextInput
                                    label="放送開始年"
                                    placeholder="西暦4桁"
                                    type="number"
                                    value={year}
                                    onChange={(event) => setYear(event.currentTarget.value)}
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, xl: 2 }}>
                                <Select
                                    label="シーズン"
                                    data={seasonsList.map((option) => ({
                                        value: option.value,
                                        label: option.name,
                                    }))}
                                    value={season}
                                    onChange={(value) => setSeason((value as SeasonValue | null) ?? season)}
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, xl: 6 }}>
                                <TextInput
                                    label="番組名"
                                    placeholder="番組名"
                                    disabled={isUnclassifiable}
                                    value={programName}
                                    onChange={(event) => setProgramName(event.currentTarget.value)}
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, xl: 2 }}>
                                <Text size="sm" fw={500} mb={8}>
                                    番組名オプション
                                </Text>
                                <Stack gap="xs">
                                    <Checkbox
                                        label="分類不要"
                                        checked={isUnclassifiable}
                                        onChange={(event) => setIsUnclassifiable(event.currentTarget.checked)}
                                    />
                                    <Checkbox
                                        label="再放送"
                                        disabled={isUnclassifiable}
                                        checked={isRepeat}
                                        onChange={(event) => setIsRepeat(event.currentTarget.checked)}
                                    />
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Stack>
                </section>

                <section>
                    <Title order={2}>出力</Title>
                    <Button mt="sm" mb="sm" variant="filled" color="gray" onClick={copyOutput}>
                        コピー
                    </Button>
                    <pre className="rounded-md bg-gray-100 p-5">{output}</pre>
                </section>

                <section>
                    <Stack gap="sm">
                        <Title order={2}>保存先のルール</Title>

                        <Title order={3}>基本構成</Title>
                        <List listStyleType="disc" withPadding>
                            <ListItem>
                                <Code>年/放送時期/番組名</Code>
                            </ListItem>
                        </List>

                        <Title order={3}>年</Title>
                        <List listStyleType="disc" withPadding>
                            <ListItem>西暦を4桁で書く</ListItem>
                        </List>

                        <Title order={3}>シーズン</Title>
                        <List listStyleType="disc" withPadding>
                            <ListItem>
                                アニメの場合は以下のルールを利用する
                                <List mt={6} listStyleType="disc" withPadding>
                                    <ListItem>プレフィクスは00番台を利用する</ListItem>
                                    <ListItem>
                                        冬アニメは<Code>01_winter</Code>
                                    </ListItem>
                                    <ListItem>
                                        春アニメは<Code>02_spring</Code>
                                    </ListItem>
                                    <ListItem>
                                        夏アニメは<Code>03_summer</Code>
                                    </ListItem>
                                    <ListItem>
                                        秋アニメは<Code>04_autumn</Code>
                                    </ListItem>
                                    <ListItem>
                                        連続した複数のシーズンに跨がって放送する場合，初回放送の時期を利用し，時期が変わっても同じディレクトリに保存する
                                    </ListItem>
                                </List>
                            </ListItem>
                            <ListItem>
                                アニメ以外の番組では<Code>10_other</Code>を利用する
                            </ListItem>
                        </List>

                        <Title order={3}>番組名</Title>
                        <List listStyleType="disc" withPadding>
                            <ListItem>基本的にアルファベットで書く</ListItem>
                            <ListItem>
                                番組名のアルファベットは公式サイトのドメインやSNSのアカウント名などを利用する
                            </ListItem>
                            <ListItem>
                                番組が再放送の場合，頭に<Code>repeat_</Code>を付与する
                            </ListItem>
                            <ListItem>
                                特番などで分類が不要な場合，上記ルールを適用せずに<Code>10_other</Code>を利用する
                            </ListItem>
                        </List>
                    </Stack>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
