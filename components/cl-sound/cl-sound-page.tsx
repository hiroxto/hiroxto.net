'use client';

import { Button, Group, Slider, Stack, Text, Title } from '@mantine/core';
import { ContactlessPaymentIcon } from '@phosphor-icons/react/dist/csr/ContactlessPayment';
import { useEffect, useRef, useState } from 'react';
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

interface PlaybackOptions {
    volume?: number;
    onEnded?: () => void;
    onError?: () => void;
}

// 全音の終了までは無音区間も含めて再生中とし、停止時には予約済みの音も解放する。
function playTonePlan(plan: TonePlanItem[], options: PlaybackOptions = {}) {
    let context: AudioContext | null = null;
    let gainNode: GainNode | null = null;
    const oscillators: OscillatorNode[] = [];
    let finished = false;

    function release() {
        if (finished) {
            return;
        }
        finished = true;
        for (const oscillator of oscillators) {
            oscillator.stop();
            oscillator.disconnect();
        }
        gainNode?.disconnect();
        if (context != null && context.state !== 'closed') {
            void context.close().catch((error: unknown) => {
                console.error('Failed to close audio context:', error);
            });
        }
    }

    function fail() {
        if (finished) {
            return;
        }
        release();
        options.onError?.();
    }

    try {
        context = new AudioContext();
        gainNode = context.createGain();
        gainNode.gain.value = (options.volume ?? 100) / 100;
        gainNode.connect(context.destination);
        const startedAt = context.currentTime;
        let remainingToneCount = plan.length;

        for (const item of plan) {
            const oscillator = context.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = item.frequency;
            oscillator.connect(gainNode);
            oscillator.addEventListener(
                'ended',
                () => {
                    if (finished) {
                        return;
                    }
                    oscillator.disconnect();
                    remainingToneCount -= 1;
                    if (remainingToneCount === 0) {
                        release();
                        options.onEnded?.();
                    }
                },
                { once: true },
            );
            oscillator.start(startedAt + item.startOffsetSeconds);
            oscillators.push(oscillator);
            oscillator.stop(startedAt + item.startOffsetSeconds + item.durationSeconds);
        }
        if (context.state === 'suspended') {
            void context.resume().catch(fail);
        }
    } catch {
        fail();
    }

    return {
        stop: release,
        setVolume(volume: number) {
            if (!finished && gainNode != null) {
                gainNode.gain.value = volume / 100;
            }
        },
    };
}

export const clSoundActions = {
    playSuccessTone: (options?: PlaybackOptions) => playTonePlan(successTonePlan, options),
    playAlertTone: (options?: PlaybackOptions) => playTonePlan(alertTonePlan, options),
};

export function ClSoundPage() {
    const [volume, setVolume] = useState(100);
    const [playingTone, setPlayingTone] = useState<'success' | 'alert' | null>(null);
    const [hasPlaybackError, setHasPlaybackError] = useState(false);
    const isPlayingRef = useRef(false);
    const playbackRef = useRef<ReturnType<typeof playTonePlan> | null>(null);

    useEffect(
        () => () => {
            playbackRef.current?.stop();
            playbackRef.current = null;
            isPlayingRef.current = false;
        },
        [],
    );

    function play(tone: 'success' | 'alert') {
        // stateの再描画を待たずに連打による二重開始を防ぐ。
        if (isPlayingRef.current) {
            return;
        }
        isPlayingRef.current = true;
        setPlayingTone(tone);
        setHasPlaybackError(false);
        const options: PlaybackOptions = {
            volume,
            onEnded: () => {
                isPlayingRef.current = false;
                setPlayingTone(null);
            },
            onError: () => {
                isPlayingRef.current = false;
                setPlayingTone(null);
                setHasPlaybackError(true);
            },
        };
        playbackRef.current =
            tone === 'success' ? clSoundActions.playSuccessTone(options) : clSoundActions.playAlertTone(options);
    }

    return (
        <SiteSubpageFrame
            items={['tools', { label: 'EMVコンタクトレスのサウンドをWeb Audio APIで再生' }]}
            title="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
            description="EMVコンタクトレスのサウンドをWeb Audio APIで再生"
        >
            <Stack gap="xl">
                <section>
                    <Stack gap="md">
                        <div>
                            <Text fw={500} mb="xs">
                                音量: {volume}%
                            </Text>
                            <Slider
                                thumbLabel="音量"
                                min={0}
                                max={100}
                                value={volume}
                                label={(value) => `${value}%`}
                                onChange={(value) => {
                                    setVolume(value);
                                    playbackRef.current?.setVolume(value);
                                }}
                                maw={400}
                            />
                        </div>
                        <Text role="status" aria-live="polite">
                            {playingTone == null
                                ? '停止中'
                                : `${playingTone === 'success' ? 'Success' : 'Alert'} Tone 再生中`}
                        </Text>
                        {hasPlaybackError && (
                            <Text role="alert" c="red">
                                音声を再生できませんでした。もう一度お試しください。
                            </Text>
                        )}
                        <Group>
                            <Button
                                radius="sm"
                                color="green"
                                leftSection={<ContactlessPaymentIcon size={18} />}
                                disabled={playingTone != null}
                                onClick={() => play('success')}
                            >
                                Play Success Tone
                            </Button>
                            <Button
                                radius="sm"
                                color="red"
                                leftSection={<ContactlessPaymentIcon size={18} />}
                                disabled={playingTone != null}
                                onClick={() => play('alert')}
                            >
                                Play Alert Tone
                            </Button>
                        </Group>
                    </Stack>
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
