'use client';

import { Button, Checkbox, Code, Grid, List, ListItem, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useMemo, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { buildRecordedPath, getDefaultSeason, type SeasonValue, seasonsList } from '@/lib/epgs-recorded-name/path';

export function EpgsRecordedNamePage() {
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [season, setSeason] = useState<SeasonValue>(getDefaultSeason(new Date().getMonth() + 1));
    const [isUnclassifiable, setIsUnclassifiable] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [programName, setProgramName] = useState('');

    const output = useMemo(
        () =>
            buildRecordedPath({
                year,
                season,
                programName,
                isRepeat,
                isUnclassifiable,
            }),
        [year, season, programName, isRepeat, isUnclassifiable],
    );

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
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: '録画サーバーの保存先のパスを生成' }]}
            title="録画サーバーの保存先のパスを生成"
            description="録画サーバーの保存先として使うパスをルールに沿って生成。"
        >
            <Stack gap="xl">
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
