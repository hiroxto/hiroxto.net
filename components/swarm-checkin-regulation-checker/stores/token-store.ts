'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { swarmCheckinRegulationCheckerStorage } from '@/components/swarm-checkin-regulation-checker/stores/persist-storage';

interface TokenStoreState {
    token: string;
}

interface TokenStoreActions {
    setToken: (token: string) => void;
}

export const useSwarmCheckinRegulationCheckerTokenStore = create<TokenStoreState & TokenStoreActions>()(
    devtools(
        persist(
            (set) => ({
                token: '',
                setToken: (token) => {
                    set(() => ({
                        token,
                    }));
                },
            }),
            {
                name: 'swarm-checkin-regulation-checker-token',
                storage: swarmCheckinRegulationCheckerStorage,
            },
        ),
    ),
);
