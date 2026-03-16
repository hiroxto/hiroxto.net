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
    it('初期状態では Canvas で描画すること', () => {
        renderWithMantine(<QrCodeGenPage />);

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

    it('入力値と色を QR props に反映すること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<QrCodeGenPage />);

        await user.type(screen.getByLabelText('埋め込む値'), 'https://example.com');
        await user.clear(screen.getByLabelText('背景色'));
        await user.type(screen.getByLabelText('背景色'), '#112233');
        await user.clear(screen.getByLabelText('QRコードの色'));
        await user.type(screen.getByLabelText('QRコードの色'), '#abcdef');

        const props = JSON.parse(screen.getByTestId('qr-canvas').getAttribute('data-props') ?? '{}');
        expect(props.value).toBe('https://example.com');
        expect(props.bgColor).toBe('#112233');
        expect(props.fgColor).toBe('#abcdef');
        expect(props.level).toBe('H');
    });
});
