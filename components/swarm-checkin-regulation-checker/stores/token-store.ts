'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { swarmCheckinRegulationCheckerStorage } from '@/components/swarm-checkin-regulation-checker/stores/persist-storage';

const DEFAULT_AUTO_FETCH_INTERVAL_SECONDS = 5;

interface TokenStoreState {
    token: string;
    autoFetchIntervalSeconds: number;
}

interface TokenStoreActions {
    setToken: (token: string) => void;
    setAutoFetchIntervalSeconds: (seconds: number) => void;
}

export const useSwarmCheckinRegulationCheckerTokenStore = create<TokenStoreState & TokenStoreActions>()(
    devtools(
        persist(
            (set) => ({
                token: '',
                autoFetchIntervalSeconds: DEFAULT_AUTO_FETCH_INTERVAL_SECONDS,
                setToken: (token) => {
                    set(() => ({
                        token,
                    }));
                },
                setAutoFetchIntervalSeconds: (seconds) => {
                    set(() => ({
                        autoFetchIntervalSeconds: seconds,
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
