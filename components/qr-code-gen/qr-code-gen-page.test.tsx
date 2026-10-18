import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { QrCodeGenPage } from './qr-code-gen-page';

describe('QrCodeGenPage', () => {
    beforeEach(() => {
        // jsdomではCanvasの描画処理を実行できないため、ブラウザAPIだけを置き換える。
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    });

    afterEach(() => {
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
});
