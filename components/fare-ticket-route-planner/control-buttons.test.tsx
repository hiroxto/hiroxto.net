import { MantineProvider } from '@mantine/core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ControlButtons } from '@/components/fare-ticket-route-planner/control-buttons';
import { useInputSettingStore } from '@/components/fare-ticket-route-planner/stores/input-setting-store';
import { useRouteStateStore } from '@/components/fare-ticket-route-planner/stores/route-state-store';
import { useSavedRouteStore } from '@/components/fare-ticket-route-planner/stores/saved-route-store';
import { Note } from './note';
import { RouteEditor } from './route';
import { Setting } from './setting';

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

function mockViewport(isMobile: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: isMobile && query === '(max-width: 47.99em)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

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
            past: [],
            future: [],
            editGroup: null,
        });
        useInputSettingStore.setState({ useComplete: true });
        useSavedRouteStore.setState({ routes: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test('文字入力は欄ごとにまとめ、欄を離れた後の編集と削除をボタンで戻せる', async () => {
        const playSound = vi.spyOn(Audio.prototype, 'play');
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <Setting />
                <RouteEditor />
                <Note />
                <ControlButtons />
            </MantineProvider>,
        );
        expect(screen.getByRole('button', { name: '元に戻す' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'やり直す' })).toBeDisabled();
        await user.type(screen.getByPlaceholderText('発駅'), '東京');
        await user.type(screen.getByPlaceholderText('備考'), '往復');
        await user.type(screen.getByPlaceholderText('発駅'), '駅');
        playSound.mockClear();
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(playSound).toHaveBeenCalledTimes(1);
        expect(screen.getByPlaceholderText('発駅')).toHaveValue('東京');
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(screen.getByPlaceholderText('備考')).toHaveValue('');
        playSound.mockClear();
        await user.click(screen.getByRole('button', { name: 'やり直す' }));
        expect(playSound).toHaveBeenCalledTimes(1);
        expect(screen.getByPlaceholderText('備考')).toHaveValue('往復');
        await user.click(screen.getByRole('button', { name: '経路追加' }));
        expect(screen.getByRole('button', { name: 'やり直す' })).toBeDisabled();
    });

    test('欄の値を元に戻すとUndoは無効で、続けた入力と以前の編集を順に戻せる', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <Setting />
                <Note />
                <ControlButtons />
            </MantineProvider>,
        );
        const departure = screen.getByPlaceholderText('発駅');
        await user.type(departure, '上');
        await user.clear(departure);
        await user.tab();
        expect(screen.getByRole('button', { name: '元に戻す' })).toBeDisabled();
        await user.type(screen.getByPlaceholderText('備考'), '備考');
        await user.type(departure, '上');
        await user.clear(departure);
        await user.type(departure, '東京');
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(departure).toHaveValue('');
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(screen.getByPlaceholderText('備考')).toHaveValue('');
        expect(screen.getByRole('button', { name: '元に戻す' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'やり直す' }));
        expect(screen.getByPlaceholderText('備考')).toHaveValue('備考');
    });
    test('接続駅入力による行の自動追加も連続入力と一緒に戻せる', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <RouteEditor />
                <ControlButtons />
            </MantineProvider>,
        );
        await user.type(screen.getByPlaceholderText('接続駅'), '名古屋');
        expect(useRouteStateStore.getState().routes).toHaveLength(2);
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(useRouteStateStore.getState().routes).toEqual([{ id: 'initial-route', line: '', station: '' }]);
        await user.click(screen.getByRole('button', { name: 'やり直す' }));
        expect(useRouteStateStore.getState().routes[0]?.station).toBe('名古屋');
        expect(useRouteStateStore.getState().routes).toHaveLength(2);
    });
    test('設定クリアは確認取消で履歴を作らず、承認後は日付指定と発着を一度で戻す', async () => {
        const user = userEvent.setup();
        useRouteStateStore.setState({ dateOption: 'skip', departure: '東京', destination: '大阪' });
        renderControls();
        await user.click(screen.getByRole('button', { name: /設定\s*クリア/ }));
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'キャンセル' }));
        expect(screen.getByRole('button', { name: '元に戻す' })).toBeDisabled();
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: /設定\s*クリア/ }));
        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'クリア' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: '元に戻す' }));
        expect(useRouteStateStore.getState()).toMatchObject({
            dateOption: 'skip',
            departure: '東京',
            destination: '大阪',
        });
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

    test('狭い画面の固定操作から経路を追加し、同名の操作は重複しない', async () => {
        mockViewport(true);
        const user = userEvent.setup();
        renderControls();

        const actions = within(await screen.findByRole('group', { name: '経路の固定操作' }));
        await user.click(actions.getByRole('button', { name: '経路追加' }));

        expect(useRouteStateStore.getState().routes).toHaveLength(2);
        expect(useRouteStateStore.getState().routes[1]).toMatchObject({ line: '', station: '' });
        expect(screen.getAllByRole('button', { name: '経路追加' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: '保存・更新' })).toHaveLength(1);
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

    test.each([false, true])('狭幅=%sで保存・更新モーダルから新規保存できる', async (isMobile) => {
        mockViewport(isMobile);
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

        const controls = isMobile ? within(await screen.findByRole('group', { name: '経路の固定操作' })) : screen;
        await user.click(controls.getByRole('button', { name: '保存・更新' }));
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

    test.each([false, true])('狭幅=%sで保存済み経路を更新すると、その経路の設定だけを変更する', async (isMobile) => {
        mockViewport(isMobile);
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

        const controls = isMobile ? within(await screen.findByRole('group', { name: '経路の固定操作' })) : screen;
        await user.click(controls.getByRole('button', { name: '保存・更新' }));
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
