import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedRoutesPage } from '@/components/fare-ticket-route-planner/saved-routes-page';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import { renderWithMantine } from '@/test/test-utils';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/fare-ticket-route-planner/use-sound', () => ({
    useSound: () => () => {},
}));

describe('SavedRoutesPage', () => {
    beforeEach(() => {
        window.localStorage.clear();
        useSavedRouteStore.setState({
            routes: ['A', 'B'].map((id) => ({
                id,
                createdAtTs: 0,
                route: {
                    month: '10',
                    day: '20',
                    dateOption: 'use',
                    departure: `駅${id}`,
                    destination: '終点',
                    routes: [{ id: `leg-${id}`, line: '路線', station: '' }],
                    notes: '',
                },
            })),
        });
    });

    it('選択した経路を個別削除した後、残った経路を全選択して一括削除できる', async () => {
        const user = userEvent.setup();
        renderWithMantine(<SavedRoutesPage />);

        const rowA = screen.getByRole('cell', { name: '駅A' }).closest('tr');
        if (rowA == null) {
            throw new Error('駅Aの行が見つかりません');
        }
        await user.click(within(rowA).getByRole('checkbox', { name: '選択' }));
        await user.click(within(rowA).getByRole('button', { name: '削除' }));
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '削除' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        expect(screen.queryByRole('cell', { name: '駅A' })).not.toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: '全選択' })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: '選択' })).not.toBeChecked();
        expect(screen.getAllByRole('button', { name: '削除' })[0]).toBeDisabled();

        await user.click(screen.getByRole('checkbox', { name: '全選択' }));
        expect(screen.getByRole('checkbox', { name: '選択' })).toBeChecked();
        await user.click(screen.getAllByRole('button', { name: '削除' })[0]);
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '削除' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        expect(screen.queryByRole('cell', { name: '駅B' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: '削除' })).toBeDisabled();
    });
});
