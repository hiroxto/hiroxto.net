import { Anchor, Button, Group, Paper, Stack, TextInput, Title, UnstyledButton } from '@mantine/core';
import { useState } from 'react';
import { EstimateResult } from '@/components/carshare-rentacar-estimate-comparison/estimate-result';
import { ToyotaShareForm } from '@/components/carshare-rentacar-estimate-comparison/toyota-share-form';
import type { ComparisonEntry, ComparisonEntryChanges } from '@/components/carshare-rentacar-estimate-comparison/types';
import { UsageFeeForm } from '@/components/carshare-rentacar-estimate-comparison/usage-fee-form';
import { type estimateService, serviceDetails } from '@/lib/carshare-rentacar-estimate-comparison/service-estimate';

interface ComparisonCardProps {
    entry: ComparisonEntry;
    result: ReturnType<typeof estimateService>;
    lowest: number | null;
    hasTiedLowest: boolean;
    onChange: (values: ComparisonEntryChanges) => void;
    onRemove: () => void;
}

export function ComparisonCard({ entry, result, lowest, hasTiedLowest, onChange, onRemove }: ComparisonCardProps) {
    const service = serviceDetails[entry.service];
    const { label } = entry;
    const [draftLabel, setDraftLabel] = useState<string | null>(null);

    function finishEditingLabel() {
        // 空欄・空白のみで確定した場合は、変更前のラベルを維持する。
        if (draftLabel !== null && draftLabel.trim() !== '') {
            onChange({ label: draftLabel });
        }
        setDraftLabel(null);
    }

    return (
        <Paper
            component="section"
            aria-label={label}
            withBorder
            p="md"
            radius="sm"
            style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}
        >
            <Stack gap="md" style={{ flex: 1 }}>
                <Group justify="space-between" align="start">
                    {draftLabel !== null ? (
                        <TextInput
                            aria-label="サービスのラベル"
                            ref={(input) => input?.focus()}
                            value={draftLabel}
                            onChange={(event) => setDraftLabel(event.currentTarget.value)}
                            onBlur={finishEditingLabel}
                            style={{ flex: 1, minWidth: 0 }}
                        />
                    ) : (
                        <Title order={3} size="h4" aria-label={label} style={{ flex: 1, minWidth: 0 }}>
                            <UnstyledButton
                                aria-label={`${label}のラベルを編集`}
                                title="クリックしてラベルを編集"
                                onClick={() => setDraftLabel(label)}
                                style={{ font: 'inherit', overflowWrap: 'anywhere' }}
                            >
                                {label}
                            </UnstyledButton>
                        </Title>
                    )}
                    <Button
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        aria-label={`${label}を削除`}
                        onClick={onRemove}
                    >
                        削除
                    </Button>
                </Group>
                {service.url ? (
                    <Anchor href={service.url} target="_blank" rel="noreferrer" size="sm">
                        公式料金を確認
                    </Anchor>
                ) : null}
                {entry.service === 'toyotaShare' ? (
                    <ToyotaShareForm entry={entry} onChange={onChange} />
                ) : (
                    <UsageFeeForm entry={entry} onChange={onChange} />
                )}
                <EstimateResult
                    serviceId={entry.service}
                    result={result}
                    lowest={lowest}
                    hasTiedLowest={hasTiedLowest}
                />
            </Stack>
        </Paper>
    );
}
