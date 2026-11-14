import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SavedComparisonActions } from './saved-comparison-actions';
import { useSavedComparisonStore } from './stores/saved-comparison-store';

const comparison = { selected: [], distanceKm: 10, gasolinePrice: 180, fuelEfficiency: 15 };

beforeEach(() => {
    useSavedComparisonStore.setState({ comparisons: [] });
    useSavedComparisonStore.getState().saveComparison(comparison);
});

describe('保存済み比較条件の削除確認', () => {
    it('Escapeは前面だけを閉じ、キャンセル後も再度削除でき、一覧を開き直せる', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <SavedComparisonActions comparison={comparison} onLoad={() => {}} />
            </MantineProvider>,
        );
        await user.click(screen.getByRole('button', { name: '保存済みの比較条件' }));
        await user.click(screen.getByRole('button', { name: '削除' }));
        expect(screen.getByRole('dialog', { name: '比較条件の削除' })).toBeInTheDocument();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: '比較条件の削除' })).not.toBeInTheDocument());
        expect(screen.getByRole('dialog', { name: '保存済みの比較条件' })).toBeInTheDocument();
        expect(useSavedComparisonStore.getState().comparisons).toHaveLength(1);
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: '保存済みの比較条件' }));
        await user.click(screen.getByRole('button', { name: '削除' }));
        await user.click(screen.getByRole('button', { name: 'キャンセル' }));
        await waitFor(() => expect(screen.queryByRole('dialog', { name: '比較条件の削除' })).not.toBeInTheDocument());
        expect(useSavedComparisonStore.getState().comparisons).toHaveLength(1);
        await user.click(screen.getByRole('button', { name: '削除' }));
        await user.click(
            within(screen.getByRole('dialog', { name: '比較条件の削除' })).getByRole('button', { name: '削除' }),
        );
        expect(useSavedComparisonStore.getState().comparisons).toHaveLength(0);
        expect(screen.getByRole('dialog', { name: '保存済みの比較条件' })).toHaveTextContent(
            '保存済みの比較条件はありません。',
        );
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: '保存済みの比較条件' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('保存済みの比較条件はありません。');
    });
});
