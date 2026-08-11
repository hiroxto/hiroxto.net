'use client';

import { Button, Paper, Stack, Table, Text } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';

interface DtmfKey {
    label: string;
    lowFrequency: number;
    highFrequency: number;
}

interface ActiveTone {
    gainNode: GainNode;
    key: DtmfKey;
    oscillators: [OscillatorNode, OscillatorNode];
    sourceId: string;
}

const dtmfKeys: DtmfKey[][] = [
    [
        { label: '1', lowFrequency: 697, highFrequency: 1209 },
        { label: '2', lowFrequency: 697, highFrequency: 1336 },
        { label: '3', lowFrequency: 697, highFrequency: 1477 },
        { label: 'A', lowFrequency: 697, highFrequency: 1633 },
    ],
    [
        { label: '4', lowFrequency: 770, highFrequency: 1209 },
        { label: '5', lowFrequency: 770, highFrequency: 1336 },
        { label: '6', lowFrequency: 770, highFrequency: 1477 },
        { label: 'B', lowFrequency: 770, highFrequency: 1633 },
    ],
    [
        { label: '7', lowFrequency: 852, highFrequency: 1209 },
        { label: '8', lowFrequency: 852, highFrequency: 1336 },
        { label: '9', lowFrequency: 852, highFrequency: 1477 },
        { label: 'C', lowFrequency: 852, highFrequency: 1633 },
    ],
    [
        { label: '*', lowFrequency: 941, highFrequency: 1209 },
        { label: '0', lowFrequency: 941, highFrequency: 1336 },
        { label: '#', lowFrequency: 941, highFrequency: 1477 },
        { label: 'D', lowFrequency: 941, highFrequency: 1633 },
    ],
];

const highFrequencies = [1209, 1336, 1477, 1633];
const keyByLabel = new Map(dtmfKeys.flat().map((key) => [key.label, key]));
const synthesizedToneDurationMs = 150;

const findKeyForKeyboardEvent = (event: KeyboardEvent) => keyByLabel.get(event.key.toUpperCase());

export function DtmfPage() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeToneRef = useRef<ActiveTone | null>(null);
    const synthesizedClickTimerRef = useRef<number | null>(null);
    const [activeKey, setActiveKey] = useState<DtmfKey | null>(null);

    const stopTone = useCallback((sourceId?: string) => {
        const activeTone = activeToneRef.current;

        if (activeTone == null || (sourceId != null && activeTone.sourceId !== sourceId)) {
            return;
        }

        activeToneRef.current = null;
        setActiveKey(null);

        const context = audioContextRef.current;
        if (context == null || context.state === 'closed') {
            return;
        }

        const stoppedAt = context.currentTime;
        const silentAt = stoppedAt + 0.025;
        activeTone.gainNode.gain.cancelScheduledValues(stoppedAt);
        activeTone.gainNode.gain.setValueAtTime(Math.max(activeTone.gainNode.gain.value, 0.0001), stoppedAt);
        activeTone.gainNode.gain.exponentialRampToValueAtTime(0.0001, silentAt);

        for (const oscillator of activeTone.oscillators) {
            oscillator.stop(silentAt + 0.005);
        }

        activeTone.oscillators[1].addEventListener('ended', () => {
            for (const oscillator of activeTone.oscillators) {
                oscillator.disconnect();
            }
            activeTone.gainNode.disconnect();
        });
    }, []);

    const startTone = useCallback(
        (key: DtmfKey, sourceId: string) => {
            if (activeToneRef.current?.key.label === key.label && activeToneRef.current.sourceId === sourceId) {
                return;
            }

            stopTone();

            const context = audioContextRef.current ?? new AudioContext();
            audioContextRef.current = context;

            if (context.state === 'suspended') {
                void context.resume();
            }

            const startedAt = context.currentTime;
            const gainNode = context.createGain();
            gainNode.gain.setValueAtTime(0.0001, startedAt);
            gainNode.gain.exponentialRampToValueAtTime(0.12, startedAt + 0.015);
            gainNode.connect(context.destination);

            const oscillators = [key.lowFrequency, key.highFrequency].map((frequency) => {
                const oscillator = context.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, startedAt);
                oscillator.connect(gainNode);
                oscillator.start(startedAt);
                return oscillator;
            }) as [OscillatorNode, OscillatorNode];

            activeToneRef.current = { gainNode, key, oscillators, sourceId };
            setActiveKey(key);
        },
        [stopTone],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            const key = findKeyForKeyboardEvent(event);
            if (key == null || event.repeat) {
                return;
            }

            event.preventDefault();
            startTone(key, `keyboard:${event.code}`);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            stopTone(`keyboard:${event.code}`);
        };

        const handleWindowBlur = () => stopTone();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [startTone, stopTone]);

    useEffect(
        () => () => {
            if (synthesizedClickTimerRef.current != null) {
                window.clearTimeout(synthesizedClickTimerRef.current);
            }

            const activeTone = activeToneRef.current;
            if (activeTone != null) {
                for (const oscillator of activeTone.oscillators) {
                    oscillator.stop();
                }
                activeTone.gainNode.disconnect();
            }

            activeToneRef.current = null;
            const context = audioContextRef.current;
            audioContextRef.current = null;
            if (context != null && context.state !== 'closed') {
                void context.close();
            }
        },
        [],
    );

    return (
        <SiteSubpageFrame
            items={[{ label: 'Tools', href: '/tools' }, { label: 'DTMF' }]}
            title="DTMF"
            description="WebAudio APIでDTMFの合成信号音を再生"
        >
            <Paper component="section" withBorder p="md" maw={600}>
                <Stack gap="md">
                    <Table withTableBorder withColumnBorders layout="fixed" horizontalSpacing={4} verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th aria-label="低群周波数" />
                                {highFrequencies.map((frequency) => (
                                    <Table.Th key={frequency} ta="center" scope="col">
                                        <Text component="span" size="xs" fw={700}>
                                            {frequency} Hz
                                        </Text>
                                    </Table.Th>
                                ))}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {dtmfKeys.map((row) => (
                                <Table.Tr key={row[0].lowFrequency}>
                                    <Table.Th ta="center" scope="row">
                                        <Text component="span" size="xs" fw={700}>
                                            {row[0].lowFrequency} Hz
                                        </Text>
                                    </Table.Th>
                                    {row.map((key) => {
                                        const isActive = activeKey?.label === key.label;

                                        return (
                                            <Table.Td key={key.label}>
                                                <Button
                                                    type="button"
                                                    fullWidth
                                                    px="xs"
                                                    variant={isActive ? 'filled' : 'light'}
                                                    aria-label={`${key.label}、${key.lowFrequency} Hzと${key.highFrequency} Hz`}
                                                    aria-pressed={isActive}
                                                    style={{ touchAction: 'none' }}
                                                    onContextMenu={(event) => event.preventDefault()}
                                                    onClick={(event) => {
                                                        if (event.detail !== 0) {
                                                            return;
                                                        }

                                                        if (synthesizedClickTimerRef.current != null) {
                                                            window.clearTimeout(synthesizedClickTimerRef.current);
                                                        }

                                                        const sourceId = `synthesized-click:${key.label}`;
                                                        startTone(key, sourceId);
                                                        synthesizedClickTimerRef.current = window.setTimeout(() => {
                                                            stopTone(sourceId);
                                                            synthesizedClickTimerRef.current = null;
                                                        }, synthesizedToneDurationMs);
                                                    }}
                                                    onPointerDown={(event) => {
                                                        if (event.pointerType === 'mouse' && event.button !== 0) {
                                                            return;
                                                        }

                                                        event.currentTarget.setPointerCapture(event.pointerId);
                                                        startTone(key, `pointer:${event.pointerId}`);
                                                    }}
                                                    onPointerUp={(event) => stopTone(`pointer:${event.pointerId}`)}
                                                    onPointerCancel={(event) => stopTone(`pointer:${event.pointerId}`)}
                                                    onLostPointerCapture={(event) =>
                                                        stopTone(`pointer:${event.pointerId}`)
                                                    }
                                                    onKeyDown={(event) => {
                                                        if (
                                                            (event.key !== 'Enter' && event.key !== ' ') ||
                                                            event.repeat
                                                        ) {
                                                            return;
                                                        }

                                                        event.preventDefault();
                                                        startTone(key, `button:${key.label}`);
                                                    }}
                                                    onKeyUp={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            stopTone(`button:${key.label}`);
                                                        }
                                                    }}
                                                    onBlur={() => stopTone(`button:${key.label}`)}
                                                >
                                                    {key.label}
                                                </Button>
                                            </Table.Td>
                                        );
                                    })}
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    <div>
                        <Text fw={500} aria-live="polite">
                            {activeKey == null
                                ? '停止中'
                                : `${activeKey.label} (${activeKey.lowFrequency} Hz + ${activeKey.highFrequency} Hz)`}
                        </Text>
                        <Text size="sm" c="dimmed" mt={4}>
                            ボタン押下中に信号音を再生します。物理キーボードの0-9，*，#，A-Dでも操作可能。
                        </Text>
                    </div>
                </Stack>
            </Paper>
        </SiteSubpageFrame>
    );
}
