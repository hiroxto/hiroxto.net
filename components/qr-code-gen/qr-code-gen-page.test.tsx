import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { QrCodeGenPage } from './qr-code-gen-page';

vi.mock('qrcode.react', () => ({
    QRCodeCanvas: (props: Record<string, unknown>) => (
        <div data-testid="qr-canvas" data-props={JSON.stringify(props)} />
    ),
    QRCodeSVG: (props: Record<string, unknown>) => <div data-testid="qr-svg" data-props={JSON.stringify(props)} />,
}));

describe('QrCodeGenPage', () => {
    it('初期状態で入力欄と Canvas のプレビューを表示する', () => {
        renderWithMantine(<QrCodeGenPage />);

        expect(screen.getByLabelText('埋め込む値')).toBeInTheDocument();
        expect(screen.getByLabelText('背景色')).toBeInTheDocument();
        expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
        expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
    });

    it('描画方式を切り替えると選択した方式で表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));

        expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
        expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();
    });

    it('容量を超えた入力をエラー表示し、入力を修正するとプレビューが戻る', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        const input = screen.getByLabelText('埋め込む値');
        await user.click(input);
        await user.paste('a'.repeat(1274));

        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText(/QRコードの容量を超えています/)).toBeInTheDocument();
        expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();

        await user.clear(input);
        await user.paste('a'.repeat(1273));

        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
    });

    it('容量を超えていても誤り訂正レベルを下げると選択した描画方式で表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));
        await user.click(screen.getByLabelText('埋め込む値'));
        await user.paste('a'.repeat(1274));
        expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('Level L (7%)'));
        expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
        expect(screen.queryByText(/QRコードの容量を超えています/)).not.toBeInTheDocument();
    });
});
