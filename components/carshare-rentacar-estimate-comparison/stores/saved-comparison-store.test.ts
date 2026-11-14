import { beforeEach, describe, expect, it } from 'vitest';
import type { ComparisonSnapshot } from '../types';
import { useSavedComparisonStore } from './saved-comparison-store';

const comparison: ComparisonSnapshot = {
    distanceKm: 50,
    gasolinePrice: '',
    fuelEfficiency: 15,
    selected: [
        {
            id: 'candidate',
            service: 'timesCar',
            number: 1,
            label: '東京店',
            usageFee: '',
            allDistance: true,
            toyotaPlan: 'short',
            toyotaHours: 3,
        },
    ],
};

describe('比較条件の保存', () => {
    beforeEach(() => {
        useSavedComparisonStore.setState({ comparisons: [] });
    });
    it('空欄と候補の全設定を保存し、新規保存のIDを分ける', () => {
        const input = { ...comparison, selected: [...comparison.selected] };
        const first = useSavedComparisonStore.getState().saveComparison(input);
        const second = useSavedComparisonStore.getState().saveComparison(input);
        expect(first).not.toBe(second);
        expect(useSavedComparisonStore.getState().comparisons[0]).toEqual({
            id: first,
            createdAtTs: expect.any(Number),
            comparison: input,
        });
        input.selected[0] = { ...input.selected[0], label: '変更' };
        expect(useSavedComparisonStore.getState().comparisons[0]?.comparison.selected[0]?.label).toBe('東京店');
    });
    it('上書きでIDと作成日時を維持し、個別削除で他の保存を残す', () => {
        const input = { ...comparison, selected: [...comparison.selected] };
        const id = useSavedComparisonStore.getState().saveComparison(input);
        const other = useSavedComparisonStore.getState().saveComparison(input);
        const createdAtTs = useSavedComparisonStore.getState().comparisons[0]?.createdAtTs;
        useSavedComparisonStore.getState().updateComparison(id, { ...input, distanceKm: '' });
        expect(useSavedComparisonStore.getState().comparisons[0]).toMatchObject({
            id,
            createdAtTs,
            comparison: { distanceKm: '' },
        });
        useSavedComparisonStore.getState().deleteComparison(id);
        expect(useSavedComparisonStore.getState().comparisons.map((item) => item.id)).toEqual([other]);
    });
    it('永続化した入力条件を再読み込みできる', async () => {
        const input = { ...comparison, selected: [...comparison.selected] };
        useSavedComparisonStore.getState().saveComparison(input);
        const persisted = localStorage.getItem('carshare-rentacar-saved-comparisons');
        useSavedComparisonStore.setState({ comparisons: [] });
        localStorage.setItem('carshare-rentacar-saved-comparisons', persisted as string);
        await useSavedComparisonStore.persist.rehydrate();
        expect(useSavedComparisonStore.getState().comparisons[0]?.comparison).toEqual(input);
        expect(JSON.parse(persisted as string).state).toEqual({ comparisons: expect.any(Array) });
    });
});
