'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { fareTicketRoutePlannerStorage } from '@/components/fare-ticket-route-planner/stores/persist-storage';

interface InputSettingState {
    useComplete: boolean;
}

interface InputSettingActions {
    enableComplete: () => void;
    disableComplete: () => void;
}

export const useInputSettingStore = create<InputSettingState & InputSettingActions>()(
    devtools(
        persist(
            (set) => ({
                useComplete: true,
                enableComplete: () => {
                    set(() => ({
                        useComplete: true,
                    }));
                },
                disableComplete: () => {
                    set(() => ({
                        useComplete: false,
                    }));
                },
            }),
            { name: 'input-setting', storage: fareTicketRoutePlannerStorage },
        ),
    ),
);
