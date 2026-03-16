import { beforeEach, describe, expect, test } from 'vitest';
import { useInputSettingStore } from './input-setting-store';

describe('useInputSettingStore', () => {
    beforeEach(() => {
        useInputSettingStore.setState({ useComplete: true });
    });

    test('初期値は useComplete=true であること', () => {
        expect(useInputSettingStore.getState().useComplete).toBe(true);
    });

    test('enableComplete と disableComplete で状態を切り替えられること', () => {
        useInputSettingStore.getState().disableComplete();
        expect(useInputSettingStore.getState().useComplete).toBe(false);

        useInputSettingStore.getState().enableComplete();
        expect(useInputSettingStore.getState().useComplete).toBe(true);
    });

    test('永続化キーが input-setting であること', () => {
        expect(useInputSettingStore.persist.getOptions().name).toBe('input-setting');
    });
});
