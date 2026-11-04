'use client';

import { Button, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { useSavedComparisonStore } from '@/components/carshare-rentacar-estimate-comparison/stores/saved-comparison-store';
import type { ComparisonSnapshot } from '@/components/carshare-rentacar-estimate-comparison/types';

interface SavedComparisonActionsProps {
    comparison: ComparisonSnapshot;
    onLoad: (comparison: ComparisonSnapshot) => void;
}

export function SavedComparisonActions({ comparison, onLoad }: SavedComparisonActionsProps) {
    const comparisons = useSavedComparisonStore((state) => state.comparisons);
    const saveComparison = useSavedComparisonStore((state) => state.saveComparison);
    const updateComparison = useSavedComparisonStore((state) => state.updateComparison);
    const deleteComparison = useSavedComparisonStore((state) => state.deleteComparison);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [saveOpened, setSaveOpened] = useState(false);
    const [listOpened, setListOpened] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const active = comparisons.find((item) => item.id === activeId);

    return (
        <>
            <Group>
                <Button variant="light" onClick={() => setSaveOpened(true)}>
                    比較条件を保存
                </Button>
                <Button variant="outline" onClick={() => setListOpened(true)}>
                    保存済みの比較条件
                </Button>
            </Group>
            <Modal opened={saveOpened} onClose={() => setSaveOpened(false)} title="比較条件の保存">
                <Stack>
                    <Text size="sm">
                        共通の走行条件と比較候補を、このブラウザに保存します。空欄のままでも保存できます。
                    </Text>
                    {active ? (
                        <Text size="sm">
                            読み込み中:{' '}
                            {active.comparison.selected.map((entry) => entry.label).join('、') || '比較候補なし'}
                        </Text>
                    ) : null}
                    <Group justify="flex-end">
                        {active ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    updateComparison(active.id, comparison);
                                    setSaveOpened(false);
                                }}
                            >
                                上書き保存
                            </Button>
                        ) : null}
                        <Button
                            onClick={() => {
                                setActiveId(saveComparison(comparison));
                                setSaveOpened(false);
                            }}
                        >
                            新規保存
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal opened={listOpened} onClose={() => setListOpened(false)} title="保存済みの比較条件" size="lg">
                <Stack>
                    {comparisons.length === 0 ? (
                        <Text c="dimmed">保存済みの比較条件はありません。</Text>
                    ) : (
                        comparisons.map((item) => (
                            <Paper key={item.id} withBorder p="md">
                                <Stack gap="xs">
                                    <Text style={{ overflowWrap: 'anywhere' }}>
                                        {item.comparison.selected.map((entry) => entry.label).join('、') ||
                                            '比較候補なし'}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        保存日時: {new Date(item.createdAtTs).toLocaleString('ja-JP')}
                                    </Text>
                                    <Text size="sm">
                                        走行距離:{' '}
                                        {item.comparison.distanceKm === ''
                                            ? '未入力'
                                            : `${item.comparison.distanceKm}km`}
                                    </Text>
                                    <Group justify="flex-end">
                                        <Button
                                            variant="light"
                                            onClick={() => {
                                                onLoad(structuredClone(item.comparison));
                                                setActiveId(item.id);
                                                setListOpened(false);
                                            }}
                                        >
                                            読み込む
                                        </Button>
                                        <Button color="red" variant="outline" onClick={() => setDeleteId(item.id)}>
                                            削除
                                        </Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        ))
                    )}
                </Stack>
            </Modal>
            <Modal opened={deleteId !== null} onClose={() => setDeleteId(null)} title="比較条件の削除">
                <Stack>
                    <Text>この比較条件を削除しますか？</Text>
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setDeleteId(null)}>
                            キャンセル
                        </Button>
                        <Button
                            color="red"
                            onClick={() => {
                                if (deleteId) deleteComparison(deleteId);
                                setDeleteId(null);
                            }}
                        >
                            削除
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
