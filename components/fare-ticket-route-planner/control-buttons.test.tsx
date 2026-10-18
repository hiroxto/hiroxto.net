import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ControlButtons } from '@/components/fare-ticket-route-planner/control-buttons';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';

// jsdomで未対応の音声APIだけを置き換え、画面部品は実物を使う。
vi.hoisted(() => {
    vi.stubGlobal(
        'Audio',
        class {
            currentTime = 0;
            load() {}
            play() {
                return Promise.resolve();
            }
        },
    );
});

function renderControls() {
    return render(
        <MantineProvider env="test">
            <ControlButtons />
        </MantineProvider>,
    );
}

describe('ControlButtons', () => {
    afterAll(() => vi.unstubAllGlobals());
    beforeEach(() => {
        window.localStorage.clear();

        useRouteStateStore.setState({
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
        vi.restoreAllMocks();
    });

    test('本日ボタンで現在日付を設定できる', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 2, 10, 12));
        const user = userEvent.setup();
        renderControls();

        await user.click(screen.getByRole('button', { name: '本日' }));

        expect(useRouteStateStore.getState()).toMatchObject({
            dateOption: 'use',
            month: '3',
            day: '10',
        });
    });

    test('補完の有効状態を切り替えられる', async () => {
        const user = userEvent.setup();
        renderControls();

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

        renderControls();

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
        renderControls();

        await user.click(screen.getByRole('button', { name: '経路追加' }));

        expect(useRouteStateStore.getState().routes).toHaveLength(2);
        expect(useRouteStateStore.getState().routes[1]).toMatchObject({ line: '', station: '' });
    });

    test('空経路クリアボタンで路線と接続駅が空の行を除外する', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            routes: [
                { id: 'empty-route', line: '', station: '' },
                { id: 'valued-route', line: '東海道線', station: '東京' },
            ],
        });

        renderControls();

        await user.click(screen.getByRole('button', { name: /空経路\s*クリア/ }));

        expect(useRouteStateStore.getState().routes).toEqual([
            { id: 'valued-route', line: '東海道線', station: '東京' },
        ]);
    });

    test('保存済み経路へのリンクを表示する', () => {
        renderControls();

        expect(screen.getByRole('link', { name: /保存済み\s*経路/ })).toHaveAttribute(
            'href',
            '/tools/fare-ticket-route-planner/states',
        );
    });

    test('設定クリアの確認後に日付指定と駅設定を初期化する', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
            dateOption: 'skip',
            departure: '東京',
            destination: '新大阪',
        });

        renderControls();

        await user.click(screen.getByRole('button', { name: /設定\s*クリア/ }));
        expect(await screen.findByText('設定をクリアしますか？')).toBeInTheDocument();

        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'クリア' }));

        expect(useRouteStateStore.getState()).toMatchObject({
            dateOption: 'use',
            departure: '',
            destination: '',
        });
    });

    test('保存・更新モーダルから新規保存できる', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({
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

        renderControls();

        await user.click(screen.getByRole('button', { name: '保存・更新' }));
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '新規保存' }));

        expect(useSavedRouteStore.getState().routes).toHaveLength(1);
        expect(useSavedRouteStore.getState().routes[0]?.route).toEqual({
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

    test('保存済み経路を選んで更新すると、その経路の設定だけを変更する', async () => {
        const user = userEvent.setup();
        const savedRoute = {
            month: '1',
            day: '2',
            dateOption: 'skip' as const,
            departure: '東京',
            destination: '尼崎',
            routes: [{ id: 'route-1', line: '東海道線', station: '' }],
            notes: '保存時の備考',
        };
        useSavedRouteStore.setState({
            routes: [
                { id: 'saved-1', createdAtTs: 1, route: savedRoute },
                { id: 'saved-2', createdAtTs: 2, route: savedRoute },
            ],
        });
        useRouteStateStore.setState({
            month: '3',
            day: '14',
            dateOption: 'use',
            departure: '新大阪',
            destination: '博多',
            routes: [{ id: 'current-route', line: '山陽新幹線', station: '' }],
            notes: '更新後の備考',
        });
        renderControls();

        await user.click(screen.getByRole('button', { name: '保存・更新' }));
        const dialog = within(await screen.findByRole('dialog'));
        expect(dialog.getByRole('button', { name: '更新' })).toBeDisabled();
        await user.click(dialog.getByRole('combobox', { name: '更新先を選択' }));
        await user.click(await screen.findByRole('option', { name: '東京 → 尼崎 / ID: saved-1' }));
        await user.click(dialog.getByRole('button', { name: '更新' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

        expect(useSavedRouteStore.getState().routes.map(({ id, route }) => ({ id, route }))).toEqual([
            {
                id: 'saved-1',
                route: {
                    month: '3',
                    day: '14',
                    dateOption: 'use',
                    departure: '新大阪',
                    destination: '博多',
                    routes: [{ id: 'current-route', line: '山陽新幹線', station: '' }],
                    notes: '更新後の備考',
                },
            },
            {
                id: 'saved-2',
                route: {
                    month: '1',
                    day: '2',
                    dateOption: 'skip',
                    departure: '東京',
                    destination: '尼崎',
                    routes: [{ id: 'route-1', line: '東海道線', station: '' }],
                    notes: '保存時の備考',
                },
            },
        ]);
    });
});
