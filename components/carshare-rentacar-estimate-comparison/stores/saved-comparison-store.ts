'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { comparisonStorage } from '@/components/carshare-rentacar-estimate-comparison/stores/persist-storage';
import type { ComparisonSnapshot } from '@/components/carshare-rentacar-estimate-comparison/types';

interface SavedComparison {
    id: string;
    createdAtTs: number;
    comparison: ComparisonSnapshot;
}
interface SavedComparisonStore {
    comparisons: SavedComparison[];
    saveComparison: (comparison: ComparisonSnapshot) => string;
    updateComparison: (id: string, comparison: ComparisonSnapshot) => void;
    deleteComparison: (id: string) => void;
}

/** 入力条件と比較候補だけを保存する。空欄・ラベル・候補の順序を維持し、結果は読み込み後に再計算する。 */
export const useSavedComparisonStore = create<SavedComparisonStore>()(
    persist(
        (set) => ({
            comparisons: [],
            saveComparison: (comparison) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    comparisons: [
                        ...state.comparisons,
                        { id, createdAtTs: Date.now(), comparison: structuredClone(comparison) },
                    ],
                }));
                return id;
            },
            updateComparison: (id, comparison) =>
                set((state) => ({
                    comparisons: state.comparisons.map((item) =>
                        item.id === id ? { ...item, comparison: structuredClone(comparison) } : item,
                    ),
                })),
            deleteComparison: (id) =>
                set((state) => ({ comparisons: state.comparisons.filter((item) => item.id !== id) })),
        }),
        {
            name: 'carshare-rentacar-saved-comparisons',
            storage: comparisonStorage,
            partialize: (state) => ({ comparisons: state.comparisons }),
        },
    ),
);
