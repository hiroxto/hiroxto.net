import { beforeEach, describe, expect, it } from 'vitest';
import { useSwarmCheckinRegulationCheckerTokenStore } from '@/components/swarm-checkin-regulation-checker/stores/token-store';

describe('useSwarmCheckinRegulationCheckerTokenStore', () => {
    beforeEach(() => {
        useSwarmCheckinRegulationCheckerTokenStore.setState({ token: '' });
    });

    it('トークンを更新できること', () => {
        useSwarmCheckinRegulationCheckerTokenStore.getState().setToken('token-value');

        expect(useSwarmCheckinRegulationCheckerTokenStore.getState().token).toBe('token-value');
    });

    it('空文字でクリアできること', () => {
        useSwarmCheckinRegulationCheckerTokenStore.setState({ token: 'token-value' });

        useSwarmCheckinRegulationCheckerTokenStore.getState().setToken('');

        expect(useSwarmCheckinRegulationCheckerTokenStore.getState().token).toBe('');
    });
});
