'use client';

import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';

interface TonePlanItem {
    frequency: number;
    durationSeconds: number;
    startOffsetSeconds: number;
}

const successTonePlan: TonePlanItem[] = [{ frequency: 1500, durationSeconds: 0.5, startOffsetSeconds: 0 }];

const alertTonePlan: TonePlanItem[] = [
    { frequency: 750, durationSeconds: 0.2, startOffsetSeconds: 0 },
    { frequency: 750, durationSeconds: 0.2, startOffsetSeconds: 0.4 },
];

const playTonePlan = (plan: TonePlanItem[]) => {
    const context = new AudioContext();
    const startedAt = context.currentTime;

    for (const item of plan) {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = item.frequency;
        oscillator.connect(context.destination);
        oscillator.start(startedAt + item.startOffsetSeconds);
        oscillator.stop(startedAt + item.startOffsetSeconds + item.durationSeconds);
    }
};

export const clSoundActions = {
    playSuccessTone: () => {
        playTonePlan(successTonePlan);
    },
    playAlertTone: () => {
        playTonePlan(alertTonePlan);
    },
};

export function ClSoundPage() {
    return (
        <SiteSubpageFrame
            items={[
                { label: 'ツール一覧', href: '/tools' },
                { label: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生' },
            ]}
            title="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
            description="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
        >
            <Stack gap="xl">
                <section>
                    <Group>
                        <Button color="green" onClick={() => clSoundActions.playSuccessTone()}>
                            Play Success Tone
                        </Button>
                        <Button color="red" onClick={() => clSoundActions.playAlertTone()}>
                            Play Alert Tone
                        </Button>
                    </Group>
                </section>

                <section>
                    <Title order={3}>仕様</Title>
                    <Text mt="xs">
                        EMVCoが出しているContactless Specifications for Payment Systemsという仕様書にEMV
                        Contactlessの仕様全般が書かれていて，オーディオ関連は9.1.2 Audio Indicationに書かれている。
                    </Text>
                    <Text mt={6}>
                        読み取り完了音はSuccess
                        Toneと定義されていて，約1500Hzの正弦波を約500ミリ秒の周期で鳴らすと規定されている。
                    </Text>
                    <Text mt={6}>
                        警告音はAlert
                        Toneと定義されていて，約750Hzの正弦波を使用して，約200ミリ秒オン，200ミリ秒オフ，約200ミリ秒オンのダブルビープを鳴らすと規定されている。
                    </Text>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
