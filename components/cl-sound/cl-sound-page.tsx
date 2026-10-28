'use client';

import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { ContactlessPaymentIcon } from '@phosphor-icons/react/dist/csr/ContactlessPayment';
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
    let remainingToneCount = plan.length;

    for (const item of plan) {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = item.frequency;
        oscillator.connect(context.destination);
        oscillator.addEventListener(
            'ended',
            () => {
                oscillator.disconnect();
                remainingToneCount -= 1;
                if (remainingToneCount === 0) {
                    void context.close().catch((error: unknown) => {
                        console.error('Failed to close audio context:', error);
                    });
                }
            },
            { once: true },
        );
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
            items={['tools', { label: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生' }]}
            title="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
            description="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
        >
            <Stack gap="xl">
                <section>
                    <Group>
                        <Button
                            radius="sm"
                            color="green"
                            leftSection={<ContactlessPaymentIcon size={18} />}
                            onClick={() => clSoundActions.playSuccessTone()}
                        >
                            Play Success Tone
                        </Button>
                        <Button
                            radius="sm"
                            color="red"
                            leftSection={<ContactlessPaymentIcon size={18} />}
                            onClick={() => clSoundActions.playAlertTone()}
                        >
                            Play Alert Tone
                        </Button>
                    </Group>
                </section>

                <section>
                    <Title order={3}>仕様</Title>
                    <Text mt="xs">
                        Contactless Specifications for Payment Systemsの9.1.2 Audio
                        Indicationにオーディオ関連の仕様が書かれている。
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
