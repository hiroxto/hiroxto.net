'use client';

import {
    Accordion,
    Alert,
    Badge,
    Button,
    Card,
    Group,
    Loader,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { CHECKIN_LIMIT_TITLES, RESULT_KEYS } from '@/lib/swarm-checkin-regulation-checker/consts';
import { FoursquareClient } from '@/lib/swarm-checkin-regulation-checker/foursquare';
import {
    addPeriod,
    checkAllLimits,
    createdAt2Date,
    date2String,
    getJstDayRange,
    subDays,
} from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem, ResultKey } from '@/lib/swarm-checkin-regulation-checker/types';

interface HistoryTarget {
    key: string;
    title: string;
    periodFrom: Date;
    periodTo: Date;
    checkins: CheckinItem[];
}

function filterCheckins(checkins: CheckinItem[], periodFrom: Date, periodTo: Date) {
    return checkins.filter((checkin) => {
        const checkinDate = createdAt2Date(checkin.createdAt).getTime();
        return checkinDate >= periodFrom.getTime() && checkinDate <= periodTo.getTime();
    });
}

function getHistoryTargets(checkins: CheckinItem[], now: Date): HistoryTarget[] {
    return [0, 1, 2].map((daysAgo) => {
        const targetDate = subDays(now, daysAgo);
        const { start, end } = getJstDayRange(targetDate);
        return {
            key: `d${daysAgo}`,
            title: daysAgo === 0 ? '本日のチェックイン一覧' : `${daysAgo}日前のチェックイン一覧`,
            periodFrom: start,
            periodTo: end,
            checkins: filterCheckins(checkins, start, end),
        };
    });
}

function LimitSummaryCard({
    resultKey,
    nowCheckins,
}: {
    resultKey: ResultKey;
    nowCheckins: ReturnType<typeof checkAllLimits>;
}) {
    const result = nowCheckins.limits[resultKey];
    const isLimited = result.isLimited;

    return (
        <Card withBorder radius="md" padding="lg">
            <Group align="flex-start" wrap="nowrap">
                <ThemeIcon size={42} radius="md" color={isLimited ? 'red' : 'teal'} variant="light">
                    <Text fw={700}>{isLimited ? '!' : 'OK'}</Text>
                </ThemeIcon>

                <Stack gap={4}>
                    <Text fw={600}>{CHECKIN_LIMIT_TITLES[resultKey]}</Text>
                    <Text c={isLimited ? 'red' : undefined}>{isLimited ? '規制中' : '規制されていません'}</Text>
                    <Text size="sm">対象チェックイン回数: {result.checkins.length}</Text>
                    <Text size="sm">対象チェックイン期間: {date2String(result.period.from)}</Text>
                    <Text size="sm">
                        規制解除: {result.unLimitingAt == null ? 'N/A' : date2String(result.unLimitingAt)}
                    </Text>
                </Stack>
            </Group>
        </Card>
    );
}

function CheckinTable({
    checkins,
    limit,
    showReleaseAt,
    placeHeader,
    computeReleaseAt,
}: {
    checkins: CheckinItem[];
    limit?: number;
    showReleaseAt: boolean;
    placeHeader: string;
    computeReleaseAt?: (checkin: CheckinItem) => string;
}) {
    const rows = checkins.map((checkin, index) => (
        <Table.Tr key={checkin.id} bg={limit != null && index + 1 >= limit ? 'var(--mantine-color-red-0)' : undefined}>
            <Table.Td>{index + 1}</Table.Td>
            <Table.Td>{date2String(createdAt2Date(checkin.createdAt))}</Table.Td>
            <Table.Td>{checkin.venue.name}</Table.Td>
            {showReleaseAt ? <Table.Td>{computeReleaseAt?.(checkin) ?? 'N/A'}</Table.Td> : null}
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>No.</Table.Th>
                    <Table.Th>チェックイン日時</Table.Th>
                    <Table.Th>{placeHeader}</Table.Th>
                    {showReleaseAt ? <Table.Th>規制解除日時</Table.Th> : null}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    );
}

export function SwarmCheckinRegulationCheckerPage() {
    const searchParams = useSearchParams();
    const hasAppliedQueryToken = useRef(false);
    const [token, setToken] = useState('');
    const [now, setNow] = useState<Date | null>(null);
    const [checkins, setCheckins] = useState<CheckinItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!hasAppliedQueryToken.current) {
            const queryToken = searchParams.get('token');
            if (queryToken != null) {
                setToken(queryToken);
            }
            hasAppliedQueryToken.current = true;
        }
    }, [searchParams]);

    useEffect(() => {
        setNow(new Date());
        const intervalId = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    const currentNow = now ?? new Date(0);
    const isHydrated = now != null;
    const limitCheckResult = useMemo(() => checkAllLimits(checkins, currentNow), [checkins, currentNow]);
    const historyTargets = useMemo(
        () => (isHydrated ? getHistoryTargets(checkins, currentNow) : []),
        [checkins, currentNow, isHydrated],
    );

    const handlePullCheckins = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const client = new FoursquareClient(token);
            const nextCheckins = await client.getSelfCheckins();
            setCheckins(nextCheckins);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '履歴の取得に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: 'Swarm コイン規制チェッカー' }]}
            title="Swarm コイン規制チェッカー"
            description="Swarmでチェックインした際に貰えるコインが規制されているかを確認するツール"
            pageSize="xl"
        >
            <Stack gap="xl">
                <div className="sticky top-0 z-30 bg-white pb-3">
                    <Card withBorder radius="md" padding="lg">
                        <Stack gap="sm">
                            <Badge
                                color={limitCheckResult.isLimited ? 'red' : 'teal'}
                                variant="light"
                                size="lg"
                                w="fit-content"
                            >
                                {limitCheckResult.isLimited ? '規制されています' : '規制されていません'}
                            </Badge>
                            <Text>
                                規制解除日時:{' '}
                                {!isHydrated
                                    ? '読み込み中'
                                    : limitCheckResult.unLimitingAts == null
                                      ? 'N/A'
                                      : date2String(limitCheckResult.unLimitingAts)}
                            </Text>
                            <Text>現在時刻: {!isHydrated ? '読み込み中' : date2String(currentNow)}</Text>
                            <Group>
                                <Button onClick={handlePullCheckins} disabled={token === '' || isLoading}>
                                    {isLoading ? '取得中...' : '履歴取得'}
                                </Button>
                                {isLoading ? <Loader size="sm" /> : null}
                            </Group>
                            {errorMessage != null ? <Alert color="red">{errorMessage}</Alert> : null}
                        </Stack>
                    </Card>
                </div>

                <Tabs defaultValue="limits">
                    <Tabs.List>
                        <Tabs.Tab value="limits">規制状況</Tabs.Tab>
                        <Tabs.Tab value="history">チェックイン履歴</Tabs.Tab>
                        <Tabs.Tab value="setting">設定</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="limits" pt="lg">
                        <Stack gap="xl">
                            <section>
                                <Title order={2}>規制状況</Title>
                                <SimpleGrid cols={{ base: 1, md: 2 }} mt="md">
                                    {RESULT_KEYS.map((resultKey) => (
                                        <LimitSummaryCard
                                            key={resultKey}
                                            resultKey={resultKey}
                                            nowCheckins={limitCheckResult}
                                        />
                                    ))}
                                </SimpleGrid>
                            </section>

                            <section>
                                <Title order={2}>チェックイン詳細</Title>
                                <Accordion multiple defaultValue={RESULT_KEYS} mt="md">
                                    <SimpleGrid cols={{ base: 1, md: 2 }}>
                                        {RESULT_KEYS.map((resultKey) => {
                                            const result = limitCheckResult.limits[resultKey];

                                            return (
                                                <Accordion.Item key={resultKey} value={resultKey}>
                                                    <Accordion.Control>
                                                        {CHECKIN_LIMIT_TITLES[resultKey]} ({result.checkins.length}件)
                                                    </Accordion.Control>
                                                    <Accordion.Panel>
                                                        <Stack gap="sm">
                                                            <Text>チェックイン数: {result.checkins.length}</Text>
                                                            <Text>
                                                                期間:{' '}
                                                                {!isHydrated
                                                                    ? '読み込み中'
                                                                    : `${date2String(result.period.from)} から ${date2String(result.period.to)} まで`}
                                                            </Text>
                                                            <CheckinTable
                                                                checkins={result.checkins}
                                                                limit={result.limit}
                                                                showReleaseAt
                                                                placeHeader="ベニュー名"
                                                                computeReleaseAt={(checkin) =>
                                                                    date2String(
                                                                        addPeriod(
                                                                            createdAt2Date(checkin.createdAt),
                                                                            result.period.value,
                                                                            result.period.unit,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </Stack>
                                                    </Accordion.Panel>
                                                </Accordion.Item>
                                            );
                                        })}
                                    </SimpleGrid>
                                </Accordion>
                            </section>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="history" pt="lg">
                        <Stack gap="xl">
                            <Title order={2}>チェックイン履歴</Title>
                            {!isHydrated ? (
                                <Text c="dimmed">読み込み中</Text>
                            ) : (
                                <Accordion multiple defaultValue={historyTargets.map((target) => target.key)}>
                                    <SimpleGrid cols={{ base: 1, md: 2 }}>
                                        {historyTargets.map((target) => (
                                            <Accordion.Item key={target.key} value={target.key}>
                                                <Accordion.Control>
                                                    {target.title} ({target.checkins.length}件)
                                                </Accordion.Control>
                                                <Accordion.Panel>
                                                    <Stack gap="sm">
                                                        <Text>チェックイン数: {target.checkins.length}</Text>
                                                        <Text>
                                                            期間: {date2String(target.periodFrom)} から{' '}
                                                            {date2String(target.periodTo)} まで
                                                        </Text>
                                                        <CheckinTable
                                                            checkins={target.checkins}
                                                            showReleaseAt={false}
                                                            placeHeader="場所"
                                                        />
                                                    </Stack>
                                                </Accordion.Panel>
                                            </Accordion.Item>
                                        ))}
                                    </SimpleGrid>
                                </Accordion>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="setting" pt="lg">
                        <Stack gap="md">
                            <Title order={2}>設定</Title>
                            <TextInput
                                label="APIトークン"
                                placeholder="Token"
                                value={token}
                                onChange={(event) => setToken(event.currentTarget.value)}
                            />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </SiteSubpageFrame>
    );
}
