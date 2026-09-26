import { MantineProvider } from '@mantine/core';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { EpgsRecordedNamePage } from './epgs-recorded-name-page';

describe('EpgsRecordedNamePage', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-07-18T12:00:00+09:00'));
        vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('ビルド後に年と季節が変わっても描画の不一致なく閲覧時の初期値を表示する', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 8, 26, 12));
        const page = (
            <MantineProvider>
                <EpgsRecordedNamePage />
            </MantineProvider>
        );
        const container = document.createElement('div');
        container.innerHTML = renderToString(page);
        document.body.append(container);
        vi.setSystemTime(new Date(2027, 0, 1, 12));
        const errors: unknown[] = [];
        const root = hydrateRoot(container, page, { onRecoverableError: (error) => errors.push(error) });

        try {
            await act(async () => {});

            expect(screen.getByLabelText('放送開始年')).toHaveValue(2027);
            expect(screen.getByRole('textbox', { name: 'シーズン' })).toHaveValue('冬アニメ');
            expect(container.querySelector('pre')).toHaveTextContent('2027/01_winter/');
            expect(errors).toEqual([]);
        } finally {
            await act(async () => root.unmount());
            container.remove();
        }
    });

    it('分類不要を選ぶと番組名欄が無効になり、パスに 10_other が入る', async () => {
        const user = userEvent.setup();
        renderWithMantine(<EpgsRecordedNamePage />);

        await user.type(screen.getByLabelText('番組名'), 'my-anime');
        await user.click(screen.getByLabelText('分類不要'));

        expect(screen.getByText('2026/03_summer/10_other')).toBeInTheDocument();
        expect(screen.getByLabelText('番組名')).toBeDisabled();
        expect(screen.getByLabelText('再放送')).toBeDisabled();
    });

    it('コピーボタンを押すと生成したパスをクリップボードに書き込む', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        renderWithMantine(<EpgsRecordedNamePage />);

        await user.type(screen.getByLabelText('番組名'), 'my-anime');
        await user.click(screen.getByRole('button', { name: 'コピー' }));

        expect(writeText).toHaveBeenCalledWith('2026/03_summer/my-anime');
        expect(window.alert).toHaveBeenCalledWith('Copied!');
    });
});
