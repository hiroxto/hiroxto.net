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
    it('初期状態ではフォームと Canvas プレビューを表示すること', () => {
        renderWithMantine(<QrCodeGenPage />);

        expect(screen.getByLabelText('埋め込む値')).toBeInTheDocument();
        expect(screen.getByLabelText('背景色')).toBeInTheDocument();
        expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
        expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
    });

    it('レンダリング方式を切り替えられること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        await user.click(screen.getByLabelText('SVG'));

        expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
        expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();
    });
});
