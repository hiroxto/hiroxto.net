'use client';

import { ColorInput, Container, Group, Radio, Slider, Stack, Text, TextInput, Title } from '@mantine/core';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { InternalLink } from '@/components/common/internal-link';

type QrCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
type QrCodeRenderAs = 'svg' | 'canvas';

export function QrCodeGenPage() {
    const [value, setValue] = useState('');
    const [size, setSize] = useState(250);
    const [margin, setMargin] = useState(0);
    const [level, setLevel] = useState<QrCodeErrorCorrectionLevel>('H');
    const [renderAs, setRenderAs] = useState<QrCodeRenderAs>('canvas');
    const [backGround, setBackGround] = useState('#ffffff');
    const [foreGround, setForeGround] = useState('#000000');

    const qrProps = {
        value,
        size,
        marginSize: margin,
        level,
        bgColor: backGround,
        fgColor: foreGround,
    } as const;

    return (
        <div className="bg-white py-8 text-[#161616]">
            <Container size="md">
                <Stack gap="xl">
                    <header>
                        <Group gap="sm">
                            <InternalLink href="/">トップページ</InternalLink>
                            <Text c="dimmed">/</Text>
                            <InternalLink href="/tools">ツール一覧</InternalLink>
                        </Group>
                    </header>

                    <section>
                        <Title order={1}>QRコード生成</Title>
                        <Text mt="xs">ブラウザでQRコードを生成。</Text>
                    </section>

                    <section>
                        <Stack gap="xl">
                            <Stack gap="md">
                                <TextInput
                                    label="埋め込む値"
                                    placeholder="値を入力"
                                    value={value}
                                    onChange={(event) => setValue(event.currentTarget.value)}
                                />

                                <div>
                                    <Text fw={500}>サイズ</Text>
                                    <Text size="sm" c="dimmed" mb={6}>
                                        {size}
                                    </Text>
                                    <Slider min={1} max={500} value={size} onChange={setSize} />
                                </div>

                                <div>
                                    <Text fw={500}>マージン</Text>
                                    <Text size="sm" c="dimmed" mb={6}>
                                        {margin}
                                    </Text>
                                    <Slider min={0} max={500} value={margin} onChange={setMargin} />
                                </div>

                                <div>
                                    <Text fw={500} mb={6}>
                                        誤り訂正レベル
                                    </Text>
                                    <Radio.Group
                                        value={level}
                                        onChange={(next) => setLevel(next as QrCodeErrorCorrectionLevel)}
                                    >
                                        <Stack gap="xs">
                                            <Radio value="L" label="Level L (7%)" />
                                            <Radio value="M" label="Level M (15%)" />
                                            <Radio value="Q" label="Level Q (25%)" />
                                            <Radio value="H" label="Level H (30%)" />
                                        </Stack>
                                    </Radio.Group>
                                </div>

                                <div>
                                    <Text fw={500} mb={6}>
                                        レンダリング方式
                                    </Text>
                                    <Radio.Group
                                        value={renderAs}
                                        onChange={(next) => setRenderAs(next as QrCodeRenderAs)}
                                    >
                                        <Stack gap="xs">
                                            <Radio value="svg" label="SVG" />
                                            <Radio value="canvas" label="Canvas" />
                                        </Stack>
                                    </Radio.Group>
                                </div>

                                <ColorInput label="背景色" format="hex" value={backGround} onChange={setBackGround} />
                                <ColorInput
                                    label="QRコードの色"
                                    format="hex"
                                    value={foreGround}
                                    onChange={setForeGround}
                                />
                            </Stack>

                            <Stack align="center" justify="center">
                                {renderAs === 'svg' ? <QRCodeSVG {...qrProps} /> : <QRCodeCanvas {...qrProps} />}
                            </Stack>
                        </Stack>
                    </section>
                </Stack>
            </Container>
        </div>
    );
}
