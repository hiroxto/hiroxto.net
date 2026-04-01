import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSwarmCheckinRegulationCheckerTokenStore } from '@/components/swarm-checkin-regulation-checker/stores/token-store';
import { renderWithMantine } from '@/test/test-utils';
import { SwarmCheckinRegulationCheckerPage } from './swarm-checkin-regulation-checker-page';

const { getSelfCheckinsMock, mockCurrentTime } = vi.hoisted(() => ({
    getSelfCheckinsMock: vi.fn(),
    mockCurrentTime: { value: null as Date | null },
}));

vi.mock('@/hooks/use-current-time', () => ({
    useCurrentTime: () => mockCurrentTime.value,
}));

vi.mock('@/lib/swarm-checkin-regulation-checker/foursquare', () => ({
    FoursquareClient: class {
        getSelfCheckins = getSelfCheckinsMock;
    },
}));

describe('SwarmCheckinRegulationCheckerPage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-10-01T03:34:56Z'));
        mockCurrentTime.value = new Date('2024-10-01T03:34:56Z');
        getSelfCheckinsMock.mockReset();
        getSelfCheckinsMock.mockResolvedValue([]);
        window.localStorage.clear();
        useSwarmCheckinRegulationCheckerTokenStore.setState({ token: 'token-value' });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('自動取得を有効化すると履歴取得ボタンのラベルが切り替わること', async () => {
        renderWithMantine(<SwarmCheckinRegulationCheckerPage />);

        fireEvent.click(screen.getByRole('tab', { name: '設定' }));
        fireEvent.click(screen.getByRole('button', { name: '自動取得を有効化' }));

        expect(screen.getByRole('button', { name: '履歴取得 / 自動取得有効' })).toBeInTheDocument();
        expect(screen.getByText('自動取得状態: 有効')).toBeInTheDocument();
    });

    it('自動取得有効中に手動取得すると次回自動取得日時を押下時刻基準で更新すること', async () => {
        renderWithMantine(<SwarmCheckinRegulationCheckerPage />);

        fireEvent.click(screen.getByRole('tab', { name: '設定' }));
        fireEvent.click(screen.getByRole('button', { name: '自動取得を有効化' }));
        fireEvent.click(screen.getByRole('button', { name: '履歴取得 / 自動取得有効' }));

        await act(async () => {
            await Promise.resolve();
        });

        expect(getSelfCheckinsMock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('次回自動取得日時: 2024-10-01 12:35:01')).toBeInTheDocument();
    });

    it('自動取得が失敗した場合は1回で無効化すること', async () => {
        getSelfCheckinsMock.mockRejectedValueOnce(new Error('API Call Error: 401'));
        renderWithMantine(<SwarmCheckinRegulationCheckerPage />);

        fireEvent.click(screen.getByRole('tab', { name: '設定' }));
        fireEvent.click(screen.getByRole('button', { name: '自動取得を有効化' }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5_000);
        });

        expect(getSelfCheckinsMock).toHaveBeenCalledTimes(1);
        expect(screen.getByText('自動取得状態: 無効')).toBeInTheDocument();
        expect(screen.getByText('次回自動取得日時: 未設定')).toBeInTheDocument();
        expect(screen.getByText('API Call Error: 401')).toBeInTheDocument();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(10_000);
        });

        expect(getSelfCheckinsMock).toHaveBeenCalledTimes(1);
    });
});
