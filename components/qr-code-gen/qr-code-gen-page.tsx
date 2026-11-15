'use client';

import { Button, ColorInput, Group, Radio, Slider, Stack, Text, Textarea } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { CopyIcon } from '@phosphor-icons/react/dist/csr/Copy';
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { buildQrCodeFileName } from '@/lib/qr-code-gen/file-name';
import { getQrCodeValidationError, type QrCodeErrorCorrectionLevel } from '@/lib/qr-code-gen/validation';

type QrCodeRenderAs = 'svg' | 'canvas';
type CopyStatus = 'idle' | 'copied' | 'failed';

function downloadFile(href: string, fileName: string) {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = fileName;
    anchor.click();
}

// qrcode.reactのCanvasは端末のピクセル比を掛けた解像度で描画されるため、指定したサイズの画像に描き直す。
function createSizedCanvas(source: HTMLCanvasElement, size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (context == null) {
        throw new Error('Canvasの2Dコンテキストを取得できません。');
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 0, 0, size, size);
    return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob == null) {
                reject(new Error('PNG画像を作成できません。'));
                return;
            }
            resolve(blob);
        }, 'image/png');
    });
}

function serializeSvg(svg: SVGSVGElement): string {
    return new XMLSerializer().serializeToString(svg);
}

export function QrCodeGenPage() {
    const [value, setValue] = useState('');
    const [size, setSize] = useState(250);
    const [margin, setMargin] = useState(0);
    const [level, setLevel] = useState<QrCodeErrorCorrectionLevel>('H');
    const [renderAs, setRenderAs] = useState<QrCodeRenderAs>('canvas');
    const [backGround, setBackGround] = useState('#ffffff');
    const [foreGround, setForeGround] = useState('#000000');
    const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const copyStatusResetTimeout = useTimeout(() => setCopyStatus('idle'), 2000);
    const validationError = useMemo(() => getQrCodeValidationError(value, level), [value, level]);
    const outputFormatLabel = renderAs === 'svg' ? 'SVG' : 'PNG';

    const qrProps = {
        value,
        size,
        marginSize: margin,
        level,
        bgColor: backGround,
        fgColor: foreGround,
    } as const;

    let qrPreview: ReactNode = null;
    if (validationError == null) {
        if (renderAs === 'svg') {
            qrPreview = <QRCodeSVG ref={svgRef} {...qrProps} />;
        } else {
            qrPreview = <QRCodeCanvas ref={canvasRef} {...qrProps} />;
        }
    }

    function handleRenderAsChange(next: QrCodeRenderAs) {
        setRenderAs(next);
        copyStatusResetTimeout.clear();
        setCopyStatus('idle');
    }

    function handleDownload() {
        const fileName = buildQrCodeFileName(new Date(), renderAs === 'svg' ? 'svg' : 'png');
        if (renderAs === 'svg') {
            if (svgRef.current == null) {
                return;
            }
            downloadFile(
                `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializeSvg(svgRef.current))}`,
                fileName,
            );
            return;
        }
        if (canvasRef.current == null) {
            return;
        }
        downloadFile(createSizedCanvas(canvasRef.current, size).toDataURL('image/png'), fileName);
    }

    async function handleCopy() {
        copyStatusResetTimeout.clear();
        try {
            if (renderAs === 'svg') {
                if (svgRef.current == null) {
                    return;
                }
                await navigator.clipboard.writeText(serializeSvg(svgRef.current));
            } else {
                if (canvasRef.current == null) {
                    return;
                }
                // Safariではユーザー操作の後に非同期処理を挟むとクリップボードへ書き込めないため、画像はPromiseのままClipboardItemへ渡す。https://webkit.org/blog/10855/async-clipboard-api/
                const pngBlob = canvasToPngBlob(createSizedCanvas(canvasRef.current, size));
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            }
            setCopyStatus('copied');
        } catch {
            setCopyStatus('failed');
        }
        copyStatusResetTimeout.start();
    }

    let copyButtonLabel = `${outputFormatLabel}をコピー`;
    let copyButtonColor = 'gray';
    if (copyStatus === 'copied') {
        copyButtonLabel = 'コピーしました';
        copyButtonColor = 'teal';
    } else if (copyStatus === 'failed') {
        copyButtonLabel = 'コピーに失敗しました';
        copyButtonColor = 'red';
    }

    return (
        <SiteSubpageFrame
            items={['tools', { label: 'QRコード生成' }]}
            title="QRコード生成"
            description="ブラウザでQRコードを生成。"
        >
            <Stack gap="xl">
                <section>
                    <Stack gap="xl">
                        <Stack gap="md">
                            <Textarea
                                labelProps={{ fw: 500 }}
                                radius="sm"
                                label="埋め込む値"
                                placeholder="値を入力"
                                value={value}
                                resize="vertical"
                                error={validationError}
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
                                    onChange={(next) => handleRenderAsChange(next as QrCodeRenderAs)}
                                >
                                    <Stack gap="xs">
                                        <Radio value="svg" label="SVG" />
                                        <Radio value="canvas" label="Canvas" />
                                    </Stack>
                                </Radio.Group>
                            </div>

                            <ColorInput
                                popoverProps={{ radius: 'sm', transitionProps: { transition: 'fade', duration: 0 } }}
                                eyeDropperButtonProps={{ radius: 'sm' }}
                                styles={{
                                    eyeDropperButton: {
                                        color: 'var(--mantine-color-gray-6)',
                                        '--ai-hover': 'rgba(134, 142, 150, 0.12)',
                                    },
                                }}
                                labelProps={{ fw: 500 }}
                                radius="sm"
                                label="背景色"
                                format="hex"
                                value={backGround}
                                onChange={setBackGround}
                            />
                            <ColorInput
                                popoverProps={{ radius: 'sm', transitionProps: { transition: 'fade', duration: 0 } }}
                                eyeDropperButtonProps={{ radius: 'sm' }}
                                styles={{
                                    eyeDropperButton: {
                                        color: 'var(--mantine-color-gray-6)',
                                        '--ai-hover': 'rgba(134, 142, 150, 0.12)',
                                    },
                                }}
                                labelProps={{ fw: 500 }}
                                radius="sm"
                                label="QRコードの色"
                                format="hex"
                                value={foreGround}
                                onChange={setForeGround}
                            />
                        </Stack>

                        {qrPreview != null && (
                            <Stack align="center" justify="center">
                                {qrPreview}
                                <Group justify="center" gap="sm">
                                    <Button
                                        radius="sm"
                                        leftSection={<DownloadSimpleIcon size={18} />}
                                        onClick={handleDownload}
                                    >
                                        {outputFormatLabel}をダウンロード
                                    </Button>
                                    <Button
                                        radius="sm"
                                        color={copyButtonColor}
                                        leftSection={<CopyIcon size={18} />}
                                        onClick={handleCopy}
                                    >
                                        {copyButtonLabel}
                                    </Button>
                                </Group>
                            </Stack>
                        )}
                    </Stack>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
