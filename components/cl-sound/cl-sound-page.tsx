'use client';

import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';

const playSuccessTone = () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1500;
    oscillator.connect(context.destination);

    const startAt = context.currentTime;
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.5);
};

const scheduleAlertBeep = (context: AudioContext, startAt: number, durationSeconds: number) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 750;
    oscillator.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationSeconds);
};

const playAlertTone = () => {
    const context = new AudioContext();
    const startAt = context.currentTime;
    scheduleAlertBeep(context, startAt, 0.2);
    scheduleAlertBeep(context, startAt + 0.4, 0.2);
};

export function ClSoundPage() {
    return (
        <SiteSubpageFrame
            items={[
                { label: 'ツール一覧', href: '/tools' },
                { label: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生' },
            ]}
        >
            <Stack gap="xl">
                <section>
                    <Title order={1}>EMVコンタクトレスのサウンドをWeb Audio APIで再生</Title>
                    <Text mt="xs">EMVコンタクトレスのサウンドをWeb Audio APIで再生</Text>
                </section>

                <section>
                    <Group>
                        <Button color="green" onClick={playSuccessTone}>
                            Play Success Tone
                        </Button>
                        <Button color="red" onClick={playAlertTone}>
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
