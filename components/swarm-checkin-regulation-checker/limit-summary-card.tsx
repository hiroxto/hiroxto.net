import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { CHECKIN_LIMIT_TITLES } from '@/lib/swarm-checkin-regulation-checker/consts';
import { date2String } from '@/lib/swarm-checkin-regulation-checker/functions';
import type { LimitCheckResult, ResultKey } from '@/lib/swarm-checkin-regulation-checker/types';

type Props = {
    resultKey: ResultKey;
    result: LimitCheckResult;
};

export const LimitSummaryCard = ({ resultKey, result }: Props) => {
    const detailColor = result.isLimited ? 'red' : undefined;

    return (
        <Card withBorder radius="md" padding="lg">
            <Group align="flex-start" wrap="nowrap">
                <ThemeIcon size={42} radius="md" color={result.isLimited ? 'red' : 'teal'} variant="light">
                    <Text fw={700}>{result.isLimited ? '!' : 'OK'}</Text>
                </ThemeIcon>

                <Stack gap={4}>
                    <Text fw={600} c={detailColor}>
                        {CHECKIN_LIMIT_TITLES[resultKey]}
                    </Text>
                    <Text c={detailColor}>{result.isLimited ? '規制中' : '規制されていません'}</Text>
                    <Text size="sm" c={detailColor}>
                        対象チェックイン回数: {result.checkins.length}
                    </Text>
                    <Text size="sm" c={detailColor}>
                        対象チェックイン期間: {date2String(result.period.from)}
                    </Text>
                    <Text size="sm" c={detailColor}>
                        規制解除: {result.unLimitingAt == null ? 'N/A' : date2String(result.unLimitingAt)}
                    </Text>
                </Stack>
            </Group>
        </Card>
    );
};
