import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { EpgsRecordedNamePage } from './epgs-recorded-name-page';

describe('EpgsRecordedNamePage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    });

    it('分類不要を選ぶと 10_other を使い入力を無効化すること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<EpgsRecordedNamePage />);

        await user.type(screen.getByLabelText('番組名'), 'my-anime');
        await user.click(screen.getByLabelText('分類不要'));

        expect(screen.getByText((content) => content.endsWith('/10_other'))).toBeInTheDocument();
        expect(screen.getByLabelText('番組名')).toBeDisabled();
        expect(screen.getByLabelText('再放送')).toBeDisabled();
    });

    it('コピー操作で出力値をクリップボードに書き込むこと', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        renderWithMantine(<EpgsRecordedNamePage />);

        await user.type(screen.getByLabelText('番組名'), 'my-anime');
        await user.click(screen.getByRole('button', { name: 'コピー' }));

        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/my-anime'));
        expect(window.alert).toHaveBeenCalledWith('Copied!');
    });
});
