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
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { createHistoryTargets } from '@/components/swarm-checkin-regulation-checker/checkin-history';
import { CheckinTable } from '@/components/swarm-checkin-regulation-checker/checkin-table';
import { LimitSummaryCard } from '@/components/swarm-checkin-regulation-checker/limit-summary-card';
import { useSwarmCheckinRegulationCheckerTokenStore } from '@/components/swarm-checkin-regulation-checker/stores/token-store';
import { useCurrentTime } from '@/hooks/use-current-time';
import { CHECKIN_LIMIT_TITLES, RESULT_KEYS } from '@/lib/swarm-checkin-regulation-checker/consts';
import { FoursquareClient } from '@/lib/swarm-checkin-regulation-checker/foursquare';
import {
    addPeriod,
    checkAllLimits,
    createdAt2Date,
    date2String,
    getNextRefreshAt,
} from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

export const SwarmCheckinRegulationCheckerPage = () => {
    const token = useSwarmCheckinRegulationCheckerTokenStore((state) => state.token);
    const setToken = useSwarmCheckinRegulationCheckerTokenStore((state) => state.setToken);
    const currentTime = useCurrentTime();
    const [comparisonNow, setComparisonNow] = useState<Date | null>(null);
    const [checkins, setCheckins] = useState<CheckinItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setComparisonNow(new Date());
    }, []);

    const resolvedCurrentTime = currentTime ?? new Date(0);
    const currentNow = comparisonNow ?? new Date(0);
    const isHydrated = comparisonNow != null;
    const nextRefreshAt = isHydrated ? getNextRefreshAt(checkins, currentNow) : null;

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        const timeoutId = window.setTimeout(
            () => {
                setComparisonNow(new Date());
            },
            Math.max((nextRefreshAt ?? currentNow).getTime() - Date.now(), 0) + 50,
        );

        return () => window.clearTimeout(timeoutId);
    }, [currentNow, isHydrated, nextRefreshAt]);
    const limitCheckResult = useMemo(() => checkAllLimits(checkins, currentNow), [checkins, currentNow]);
    const historyTargets = useMemo(
        () => (isHydrated ? createHistoryTargets(checkins, currentNow) : []),
        [checkins, currentNow, isHydrated],
    );

    const handlePullCheckins = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const client = new FoursquareClient(token);
            const nextCheckins = await client.getSelfCheckins();
            setComparisonNow(new Date());
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
                            <Text c={limitCheckResult.isLimited ? 'red' : undefined}>
                                規制解除日時:{' '}
                                {!isHydrated
                                    ? '読み込み中'
                                    : limitCheckResult.unLimitingAts == null
                                      ? 'N/A'
                                      : date2String(limitCheckResult.unLimitingAts)}
                            </Text>
                            <Text>
                                現在時刻: {currentTime == null ? '読み込み中' : date2String(resolvedCurrentTime)}
                            </Text>
                            <Text>判定時刻: {!isHydrated ? '読み込み中' : date2String(currentNow)}</Text>
                            <Text>
                                次回判定時刻: {nextRefreshAt == null ? '読み込み中' : date2String(nextRefreshAt)}
                            </Text>
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
                                            result={limitCheckResult.limits[resultKey]}
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
};
