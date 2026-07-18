import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ControlButtons } from '@/components/fare-ticket-route-planner/control-buttons';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import { renderWithMantine } from '@/test/test-utils';

vi.mock('@mantine/core', async () => {
    const actual = await vi.importActual<typeof import('@mantine/core')>('@mantine/core');

    return {
        ...actual,
        Modal: ({ opened, title, children }: { opened: boolean; title?: ReactNode; children: ReactNode }) =>
            opened ? (
                <div>
                    <div>{title}</div>
                    {children}
                </div>
            ) : null,
    };
});

vi.mock('@mantine/dates', () => ({
    DatePicker: () => null,
}));

vi.mock('@/components/fare-ticket-route-planner/sound-button', () => ({
    SoundButton: ({
        children,
        onClick,
        soundType: _soundType,
        fullWidth: _fullWidth,
        ...props
    }: ComponentPropsWithoutRef<'button'> & {
        children: ReactNode;
        soundType?: string;
        fullWidth?: boolean;
    }) => (
        <button type="button" onClick={onClick} {...props}>
            {children}
        </button>
    ),
}));

describe('ControlButtons', () => {
    beforeEach(() => {
        window.localStorage.clear();

        useRouteStateStore.setState({
            type: '片道乗車券',
            month: '',
            day: '',
            dateOption: 'use',
            departure: '',
            destination: '',
            routes: [{ id: 'initial-route', line: '', station: '' }],
            notes: '',
        });
        useInputSettingStore.setState({ useComplete: true });
        useSavedRouteStore.setState({ routes: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('本日ボタンで現在日付を設定できる', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-03-10T12:00:00+09:00'));
        const user = userEvent.setup();
        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: '本日' }));

        expect(useRouteStateStore.getState()).toMatchObject({
            dateOption: 'use',
            month: '3',
            day: '10',
        });
    });

    test('補完の有効状態を切り替えられる', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: /補完\s*無効化/ }));
        expect(useInputSettingStore.getState().useComplete).toBe(false);
        expect(screen.getByRole('button', { name: /補完\s*有効化/ })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /補完\s*有効化/ }));
        expect(useInputSettingStore.getState().useComplete).toBe(true);
        expect(screen.getByRole('button', { name: /補完\s*無効化/ })).toBeInTheDocument();
    });

    test('発着逆転ボタンで出発地と到着地を入れ替えられる', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            departure: '東京',
            destination: '博多',
            routes: [
                { id: 'route-1', line: '東海道線', station: '名古屋' },
                { id: 'route-2', line: '山陽線', station: '' },
            ],
        });

        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: '発着逆転' }));

        expect(useRouteStateStore.getState()).toMatchObject({
            departure: '博多',
            destination: '東京',
            routes: [
                { id: 'route-2', line: '山陽線', station: '名古屋' },
                { id: 'route-1', line: '東海道線', station: '' },
            ],
        });
    });

    test('経路追加ボタンで経路を1行追加できる', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: '経路追加' }));

        expect(useRouteStateStore.getState().routes).toHaveLength(2);
        expect(useRouteStateStore.getState().routes[1]).toMatchObject({ line: '', station: '' });
    });

    test('空経路クリアボタンで値のない経路を除外できる', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            routes: [
                { id: 'empty-route', line: '', station: '' },
                { id: 'valued-route', line: '東海道線', station: '東京' },
            ],
        });

        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: /空経路\s*クリア/ }));

        expect(useRouteStateStore.getState().routes).toEqual([
            { id: 'valued-route', line: '東海道線', station: '東京' },
        ]);
    });

    test('保存済み経路へのリンクを表示する', () => {
        renderWithMantine(<ControlButtons />);

        expect(screen.getByRole('link', { name: /保存済み\s*経路/ })).toHaveAttribute(
            'href',
            '/tools/fare-ticket-route-planner/states',
        );
    });

    test('設定クリアの確認後に種別と駅設定を初期化する', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            type: '片道乗車券',
            dateOption: 'skip',
            departure: '東京',
            destination: '新大阪',
        });

        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: /設定\s*クリア/ }));
        expect(screen.getByText('設定をクリアしますか？')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'クリア' }));

        expect(useRouteStateStore.getState()).toMatchObject({
            type: '片道乗車券',
            dateOption: 'use',
            departure: '',
            destination: '',
        });
    });

    test('保存・更新モーダルから新規保存できる', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });

        renderWithMantine(<ControlButtons />);

        await user.click(screen.getByRole('button', { name: '保存・更新' }));
        await user.click(screen.getByRole('button', { name: '新規保存' }));

        expect(useSavedRouteStore.getState().routes).toHaveLength(1);
        expect(useSavedRouteStore.getState().routes[0]?.route).toEqual({
            type: '片道乗車券',
            month: '1',
            day: '2',
            dateOption: 'skip',
            departure: '東京',
            destination: '尼崎',
            routes: [
                { id: 'route-1', line: '新幹線', station: '新大阪' },
                { id: 'route-2', line: '東海道線', station: '' },
            ],
            notes: 'テストnotes',
        });
    });
});
