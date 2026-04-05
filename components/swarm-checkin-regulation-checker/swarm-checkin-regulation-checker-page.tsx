'use client';

import {
    Accordion,
    Alert,
    Badge,
    Button,
    Card,
    Group,
    Loader,
    Select,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { add, differenceInMilliseconds } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { createHistoryTargets } from '@/components/swarm-checkin-regulation-checker/checkin-history';
import { CheckinTable } from '@/components/swarm-checkin-regulation-checker/checkin-table';
import { LimitSummaryCard } from '@/components/swarm-checkin-regulation-checker/limit-summary-card';
import { useSwarmCheckinRegulationCheckerTokenStore } from '@/components/swarm-checkin-regulation-checker/stores/token-store';
import { useCurrentTime } from '@/hooks/use-current-time';
import {
    AUTO_FETCH_INTERVAL_OPTIONS,
    CHECKIN_LIMIT_TITLES,
    RESULT_KEYS,
} from '@/lib/swarm-checkin-regulation-checker/consts';
import { FoursquareClient } from '@/lib/swarm-checkin-regulation-checker/foursquare';
import {
    addPeriod,
    checkAllLimits,
    createdAt2Date,
    date2String,
    getNextManualAutoFetchAt,
    getNextRefreshAt,
    resolveAutoFetchFailure,
    resolveAutoFetchSuccess,
} from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

const DEFAULT_AUTO_FETCH_INTERVAL_SECONDS = 5;

export const SwarmCheckinRegulationCheckerPage = () => {
    const token = useSwarmCheckinRegulationCheckerTokenStore((state) => state.token);
    const setToken = useSwarmCheckinRegulationCheckerTokenStore((state) => state.setToken);
    const currentTime = useCurrentTime();
    const [comparisonNow, setComparisonNow] = useState<Date | null>(null);
    const [checkins, setCheckins] = useState<CheckinItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [autoFetchEnabled, setAutoFetchEnabled] = useState(false);
    const [autoFetchIntervalSeconds, setAutoFetchIntervalSeconds] = useState(DEFAULT_AUTO_FETCH_INTERVAL_SECONDS);
    const [nextAutoFetchAt, setNextAutoFetchAt] = useState<Date | null>(null);
    const [autoFetchCachedCount, setAutoFetchCachedCount] = useState<number | null>(null);
    const [autoFetchUnchangedCount, setAutoFetchUnchangedCount] = useState(0);
    const autoFetchEnabledRef = useRef(autoFetchEnabled);

    autoFetchEnabledRef.current = autoFetchEnabled;

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

    const resetAutoFetchStability = useCallback(() => {
        setAutoFetchCachedCount(null);
        setAutoFetchUnchangedCount(0);
    }, []);

    /**
     * 履歴取得の共通入口。
     * `manual` はユーザーが明示的に押した取得で、結果表示は更新するが、未変動回数による自動取得停止判定には使わない。
     * 自動取得が有効な場合だけ、「手動取得した今」から interval 秒後を次回自動取得日時として再スケジュールする。
     * ただし手動取得の結果が「非規制 → 規制」に変わった場合は、次回自動取得日時を
     * 「規制解除日時 + interval 秒」に切り替える。
     *
     * `auto` はタイマー起点の取得で、結果表示を更新したうえで、規制件数の変動有無をキャッシュと比較する。
     * 変動なしが 3 回続いたら自動取得を停止し、キャッシュと連続回数をリセットする。
     * 停止しない場合は、規制中なら「規制解除日時 + interval 秒」、非規制なら「取得完了時刻 + interval 秒」を次回実行日時にする。
     * 自動取得が失敗した場合は、連続再試行を避けるためその時点で自動取得を無効化する。
     */
    const pullCheckins = useCallback(
        async (trigger: 'manual' | 'auto', triggeredAt: Date) => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const client = new FoursquareClient(token);
                const nextCheckins = await client.getSelfCheckins();
                const fetchedAt = new Date();
                const nextResult = checkAllLimits(nextCheckins, fetchedAt);

                setCheckins(nextCheckins);
                setComparisonNow(fetchedAt);

                if (trigger === 'auto') {
                    /** 自動取得だけを停止判定の対象にし、手動取得では未変動回数を進めない。 */
                    const nextState = resolveAutoFetchSuccess(
                        { previousCount: autoFetchCachedCount, unchangedCount: autoFetchUnchangedCount },
                        nextResult,
                        fetchedAt,
                        autoFetchIntervalSeconds,
                        autoFetchEnabledRef.current,
                    );

                    setAutoFetchEnabled(nextState.autoFetchEnabled);
                    setNextAutoFetchAt(nextState.nextAutoFetchAt);
                    setAutoFetchCachedCount(nextState.previousCount);
                    setAutoFetchUnchangedCount(nextState.unchangedCount);
                } else if (autoFetchEnabled) {
                    /** 手動取得で規制入りした場合だけ、規制解除基準へ次回自動取得日時を切り替える。 */
                    setNextAutoFetchAt(
                        getNextManualAutoFetchAt(
                            limitCheckResult.isLimited,
                            nextResult,
                            triggeredAt,
                            fetchedAt,
                            autoFetchIntervalSeconds,
                        ),
                    );
                }
            } catch (error) {
                if (trigger === 'auto' && autoFetchEnabled) {
                    /** 自動取得失敗時は即時無効化し、以後の自動再試行を止める。 */
                    const nextState = resolveAutoFetchFailure();
                    setAutoFetchEnabled(nextState.autoFetchEnabled);
                    setNextAutoFetchAt(nextState.nextAutoFetchAt);
                    setAutoFetchCachedCount(nextState.previousCount);
                    setAutoFetchUnchangedCount(nextState.unchangedCount);
                }

                setErrorMessage(error instanceof Error ? error.message : '履歴の取得に失敗しました。');
            } finally {
                setIsLoading(false);
            }
        },
        [
            autoFetchCachedCount,
            autoFetchEnabled,
            autoFetchIntervalSeconds,
            autoFetchUnchangedCount,
            limitCheckResult.isLimited,
            token,
        ],
    );

    const handlePullCheckins = async () => {
        await pullCheckins('manual', new Date());
    };

    const handleEnableAutoFetch = () => {
        const now = new Date();
        setAutoFetchEnabled(true);
        setNextAutoFetchAt(add(now, { seconds: autoFetchIntervalSeconds }));
        resetAutoFetchStability();
    };

    const handleDisableAutoFetch = () => {
        setAutoFetchEnabled(false);
        setNextAutoFetchAt(null);
        resetAutoFetchStability();
    };

    useEffect(() => {
        if (!autoFetchEnabled || isLoading || token === '' || nextAutoFetchAt == null) {
            return;
        }

        // 自動取得は毎秒の現在時刻監視ではなく、次回実行日時に向けた単発タイマーで予約する。
        const timeoutId = window.setTimeout(
            () => {
                void pullCheckins('auto', new Date());
            },
            Math.max(differenceInMilliseconds(nextAutoFetchAt, new Date()), 0),
        );

        return () => window.clearTimeout(timeoutId);
    }, [autoFetchEnabled, isLoading, nextAutoFetchAt, pullCheckins, token]);

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
                        <Stack gap="xs">
                            <Badge
                                color={limitCheckResult.isLimited ? 'red' : 'teal'}
                                variant="light"
                                size="lg"
                                w="fit-content"
                            >
                                {limitCheckResult.isLimited ? '規制されています' : '規制されていません'}
                            </Badge>
                            <Stack gap={2}>
                                <Text c={limitCheckResult.isLimited ? 'red' : undefined} lh={1.2}>
                                    規制解除日時:{' '}
                                    {!isHydrated
                                        ? '読み込み中'
                                        : limitCheckResult.unLimitingAts == null
                                          ? 'N/A'
                                          : date2String(limitCheckResult.unLimitingAts)}
                                </Text>
                                <Text lh={1.2}>
                                    現在日時: {currentTime == null ? '読み込み中' : date2String(resolvedCurrentTime)}
                                </Text>
                                <Text lh={1.2}>判定日時: {!isHydrated ? '読み込み中' : date2String(currentNow)}</Text>
                                <Text lh={1.2}>
                                    次回判定日時: {nextRefreshAt == null ? '読み込み中' : date2String(nextRefreshAt)}
                                </Text>
                            </Stack>
                            <Group>
                                <Button onClick={handlePullCheckins} disabled={token === '' || isLoading}>
                                    {isLoading
                                        ? '取得中...'
                                        : autoFetchEnabled
                                          ? '履歴取得 / 自動取得有効'
                                          : '履歴取得'}
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
                            <Select
                                label="自動取得間隔"
                                data={AUTO_FETCH_INTERVAL_OPTIONS.map((option) => ({
                                    value: option.value,
                                    label: option.label,
                                }))}
                                value={autoFetchIntervalSeconds.toString()}
                                onChange={(value) => {
                                    if (value == null) {
                                        return;
                                    }

                                    const nextIntervalSeconds = Number(value);
                                    setAutoFetchIntervalSeconds(nextIntervalSeconds);

                                    if (autoFetchEnabled) {
                                        setNextAutoFetchAt(add(new Date(), { seconds: nextIntervalSeconds }));
                                        resetAutoFetchStability();
                                    }
                                }}
                                allowDeselect={false}
                            />
                            <Group>
                                <Button
                                    onClick={autoFetchEnabled ? handleDisableAutoFetch : handleEnableAutoFetch}
                                    disabled={token === '' || isLoading}
                                    color={autoFetchEnabled ? 'red' : 'blue'}
                                    variant={autoFetchEnabled ? 'light' : 'filled'}
                                >
                                    {autoFetchEnabled ? '自動取得を無効化' : '自動取得を有効化'}
                                </Button>
                            </Group>
                            <Stack gap={2}>
                                <Text lh={1.2}>自動取得状態: {autoFetchEnabled ? '有効' : '無効'}</Text>
                                <Text lh={1.2}>
                                    次回自動取得日時:{' '}
                                    {nextAutoFetchAt == null ? '未設定' : date2String(nextAutoFetchAt)}
                                </Text>
                                <Text lh={1.2}>連続未変動回数: {autoFetchUnchangedCount}回</Text>
                            </Stack>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </SiteSubpageFrame>
    );
};
