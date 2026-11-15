import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { QrCodeGenPage } from './qr-code-gen-page';

type DownloadedFile = { href: string; download: string };

// jsdomのCanvasは描画できないため、qrcode.reactと書き出し処理が呼ぶメソッドだけを用意する。
function mockCanvasContext() {
    const context = {
        scale: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: '',
        imageSmoothingEnabled: true,
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    return context;
}

function mockDownload() {
    const downloadedFiles: DownloadedFile[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFiles.push({ href: this.href, download: this.download });
    });
    return downloadedFiles;
}

class ClipboardItemMock {
    constructor(readonly items: Record<string, Promise<Blob>>) {}
}

describe('QrCodeGenPage', () => {
    beforeEach(() => {
        // jsdomではCanvasの描画処理を実行できないため、ブラウザAPIだけを置き換える。
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
        vi.stubGlobal('ClipboardItem', ClipboardItemMock);
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 0, 23, 1, 23, 45));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('初期状態で入力欄と Canvas のプレビューを表示する', () => {
        const { container } = renderWithMantine(<QrCodeGenPage />);

        expect(screen.getByLabelText('埋め込む値')).toBeInTheDocument();
        expect(screen.getByLabelText('背景色')).toBeInTheDocument();
        expect(container.querySelector('canvas')).toBeInTheDocument();
        expect(screen.queryByRole('img')?.tagName).not.toBe('svg');
    });

    it('描画方式を切り替えると選択した方式で表示する', async () => {
        const user = userEvent.setup();
        const { container } = renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));

        expect(screen.getByRole('img').tagName).toBe('svg');
        expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('容量を超えた入力をエラー表示し、入力を修正するとプレビューが戻る', async () => {
        const user = userEvent.setup();
        const { container } = renderWithMantine(<QrCodeGenPage />);

        const input = screen.getByLabelText('埋め込む値');
        await user.click(input);
        await user.paste('a'.repeat(1274));

        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText(/QRコードの容量を超えています/)).toBeInTheDocument();
        expect(container.querySelector('canvas')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'PNGをダウンロード' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'PNGをコピー' })).not.toBeInTheDocument();

        await user.clear(input);
        await user.paste('a'.repeat(1273));

        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('容量を超えていても誤り訂正レベルを下げると選択した描画方式で表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));
        await user.click(screen.getByLabelText('埋め込む値'));
        await user.paste('a'.repeat(1274));
        expect(screen.queryByRole('img')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Level L (7%)'));
        expect(screen.getByRole('img').tagName).toBe('svg');
        expect(screen.queryByText(/QRコードの容量を超えています/)).not.toBeInTheDocument();
    });

    it('Canvas表示時はPNGのボタンだけを表示し、ピクセル比によらず指定サイズのPNGを日時付きのファイル名でダウンロードする', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
        const context = mockCanvasContext();
        const downloadedFiles = mockDownload();
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (this: HTMLCanvasElement) {
            return `data:image/png;base64,${this.width}x${this.height}`;
        });
        const { container } = renderWithMantine(<QrCodeGenPage />);

        expect(screen.queryByRole('button', { name: 'SVGをダウンロード' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'SVGをコピー' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'PNGをダウンロード' }));

        expect(downloadedFiles).toEqual([
            { href: 'data:image/png;base64,250x250', download: 'qrcode-20260123-012345.png' },
        ]);
        const previewCanvas = container.querySelector('canvas');
        expect(previewCanvas).toHaveProperty('width', 500);
        expect(context.drawImage).toHaveBeenCalledWith(previewCanvas, 0, 0, 250, 250);
    });

    it('Canvas表示時にコピーボタンを押すとPNG画像をクリップボードに書き込み、ボタンの表示が変わる', async () => {
        const user = userEvent.setup();
        mockCanvasContext();
        const pngBlob = new Blob(['png'], { type: 'image/png' });
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(pngBlob));
        const write = vi.spyOn(navigator.clipboard, 'write');
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByRole('button', { name: 'PNGをコピー' }));

        expect(write).toHaveBeenCalledTimes(1);
        const [clipboardItem] = write.mock.calls[0][0] as unknown as ClipboardItemMock[];
        await expect(clipboardItem.items['image/png']).resolves.toBe(pngBlob);
        expect(screen.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
    });

    it('クリップボードへの書き込みに失敗するとボタンに失敗を表示する', async () => {
        const user = userEvent.setup();
        mockCanvasContext();
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
            callback(new Blob(['png'], { type: 'image/png' })),
        );
        vi.spyOn(navigator.clipboard, 'write').mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByRole('button', { name: 'PNGをコピー' }));

        expect(screen.getByRole('button', { name: 'コピーに失敗しました' })).toBeInTheDocument();
    });

    it('SVG表示時はSVGのボタンだけを表示し、SVGを日時付きのファイル名でダウンロードする', async () => {
        const user = userEvent.setup();
        const downloadedFiles = mockDownload();
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));
        expect(screen.queryByRole('button', { name: 'PNGをダウンロード' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'PNGをコピー' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'SVGをダウンロード' }));

        expect(downloadedFiles).toHaveLength(1);
        expect(downloadedFiles[0].download).toBe('qrcode-20260123-012345.svg');
        const svgPrefix = 'data:image/svg+xml;charset=utf-8,';
        expect(downloadedFiles[0].href.startsWith(svgPrefix)).toBe(true);
        expect(decodeURIComponent(downloadedFiles[0].href.slice(svgPrefix.length))).toBe(
            new XMLSerializer().serializeToString(screen.getByRole('img')),
        );
    });

    it('SVG表示時にコピーボタンを押すとSVGのマークアップを文字列でクリップボードに書き込む', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));
        await user.click(screen.getByRole('button', { name: 'SVGをコピー' }));

        expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/));
        expect(screen.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
    });

    it('コピー後に描画方式を切り替えると、切り替え先のコピーボタンを初期表示で表示する', async () => {
        const user = userEvent.setup();
        mockCanvasContext();
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
            callback(new Blob(['png'], { type: 'image/png' })),
        );
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByRole('button', { name: 'PNGをコピー' }));
        expect(screen.getByRole('button', { name: 'コピーしました' })).toBeInTheDocument();
        await user.click(screen.getByLabelText('SVG'));

        expect(screen.getByRole('button', { name: 'SVGをコピー' })).toBeInTheDocument();
    });
});
