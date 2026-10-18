import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSwarmCheckinRegulationCheckerTokenStore } from '@/components/swarm-checkin-regulation-checker/stores/token-store';
import { renderWithMantine } from '@/test/test-utils';
import { SwarmCheckinRegulationCheckerPage } from './swarm-checkin-regulation-checker-page';

describe('SwarmCheckinRegulationCheckerPage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-10-01T03:34:56Z'));
        window.localStorage.clear();
        useSwarmCheckinRegulationCheckerTokenStore.setState({
            token: '',
            autoFetchIntervalSeconds: 5,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('保存済みの自動取得秒数を初期表示に反映すること', async () => {
        useSwarmCheckinRegulationCheckerTokenStore.setState({
            token: '',
            autoFetchIntervalSeconds: 30,
        });

        renderWithMantine(<SwarmCheckinRegulationCheckerPage />);

        fireEvent.click(screen.getByRole('tab', { name: '設定' }));

        expect(screen.getByRole('combobox', { name: '自動取得間隔' })).toHaveValue('30秒');
    });
});
