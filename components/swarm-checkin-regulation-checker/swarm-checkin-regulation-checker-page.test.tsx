import { fireEvent, screen } from '@testing-library/react';
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

vi.mock('@/lib/swarm-checkin-regulation-checker/api-client', () => ({
    SwarmCheckinRegulationCheckerApiClient: class {
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
        useSwarmCheckinRegulationCheckerTokenStore.setState({
            token: 'token-value',
            autoFetchIntervalSeconds: 5,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('保存済みの自動取得秒数を初期表示に反映すること', async () => {
        useSwarmCheckinRegulationCheckerTokenStore.setState({
            token: 'token-value',
            autoFetchIntervalSeconds: 30,
        });

        renderWithMantine(<SwarmCheckinRegulationCheckerPage />);

        fireEvent.click(screen.getByRole('tab', { name: '設定' }));

        expect(screen.getByRole('textbox', { name: '自動取得間隔' })).toHaveValue('30秒');
    });
});
