import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allOutsideTransferIds } from '@/lib/tokyometro-transfer-search/outside-transfers';
import type { RouteResult } from '@/lib/tokyometro-transfer-search/search';
import type { RouteSearchRequest, RouteSearchResponse } from '@/lib/tokyometro-transfer-search/search-worker-protocol';
import { renderWithMantine } from '@/test/test-utils';
import { TokyoMetroTransferSearchPage } from './tokyometro-transfer-search-page';

const pushMock = vi.fn();
const workerRequestMock = vi.fn<(request: RouteSearchRequest) => void>();

const inarichoToIriyaRoute: RouteResult = {
    key: 'inaricho-ueno-iriya',
    legs: [
        {
            fromStationId: 'inaricho',
            toStationId: 'ueno',
            lineId: 'ginza',
            distanceTenths: 7,
        },
        {
            fromStationId: 'ueno',
            toStationId: 'iriya',
            lineId: 'hibiya',
            distanceTenths: 12,
        },
    ],
    transfers: [
        {
            fromStationId: 'ueno',
            toStationId: 'ueno',
            fromLineId: 'ginza',
            toLineId: 'hibiya',
            type: 'outside',
        },
    ],
    outsideTransferCount: 1,
    insideTransferCount: 0,
    actualDistanceTenths: 19,
    shortestDistanceTenths: 19,
    fare: { ic: 178, ticket: 180 },
    fareCheckpoints: [
        {
            stationId: 'ueno',
            shortestDistanceTenths: 7,
            fare: { ic: 178, ticket: 180 },
        },
    ],
};

let workerRoute = inarichoToIriyaRoute;

class WorkerMock {
    onmessage: ((event: MessageEvent<RouteSearchResponse>) => void) | null = null;
    onerror: (() => void) | null = null;

    postMessage(request: RouteSearchRequest) {
        workerRequestMock(request);
        const routes =
            (request.originStationId === 'ayase' && request.destinationStationId === 'kita-ayase') ||
            request.originStationId === 'honancho'
                ? []
                : [workerRoute];

        queueMicrotask(() => {
            this.onmessage?.(
                new MessageEvent('message', {
                    data: {
                        status: 'success',
                        routes,
                        truncated: request.originStationId === 'wakoshi' || request.originStationId === 'honancho',
                        outsideTransferUpperBound:
                            request.originStationId === 'wakoshi' || request.originStationId === 'honancho'
                                ? (request.maximumOutsideTransferCount ?? 14)
                                : 1,
                    },
                }),
            );
        });
    }

    terminate() {}
}

const getActiveOption = (input: HTMLElement, name: RegExp) => {
    const listboxId = input.getAttribute('aria-controls');
    const option = screen.getAllByText(name).find((element) => element.closest('[role="listbox"]')?.id === listboxId);

    if (!option) {
        throw new Error(`選択中のリストに「${name.source}」が見つかりません`);
    }

    return option;
};

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
}));

describe('TokyoMetroTransferSearchPage', () => {
    it.each([
        ['5', '5'],
        ['', null],
    ])('取得件数「%s」を入力して検索するとURLに%sを保存する', async (value, expected) => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="ginza"
                initialTo="asakusa"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                initialResultLimit={30}
                queryError={null}
            />,
        );
        await screen.findByRole('heading', { name: '検索結果' });
        expect(workerRequestMock).toHaveBeenCalledWith(expect.objectContaining({ resultLimit: 30 }));
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        const input = await screen.findByRole('textbox', { name: '取得件数' });
        await user.clear(input);
        if (value) await user.type(input, value);
        await user.click(screen.getByRole('button', { name: '検索' }));
        const url = new URL(pushMock.mock.calls[0][0], 'https://example.com');
        expect(url.searchParams.get('resultLimit')).toBe(expected);
    });

    it.each(['0', '-1', '1.5', '1.0000000000000001', 'abc'])(
        '取得件数「%s」ではエラーを表示し検索しない',
        async (value) => {
            const user = userEvent.setup();
            renderWithMantine(
                <TokyoMetroTransferSearchPage
                    initialFrom="ginza"
                    initialTo="asakusa"
                    initialMaximumOutsideTransferCount={1}
                    initialIncludeInsideTransfers={true}
                    initialOutsideTransferIds={allOutsideTransferIds}
                    queryError={null}
                />,
            );
            await screen.findByRole('heading', { name: '検索結果' });
            await user.click(screen.getByRole('button', { name: '詳細指定' }));
            const input = await screen.findByRole('textbox', { name: '取得件数' });
            await user.clear(input);
            await user.type(input, value);
            await user.click(screen.getByRole('button', { name: '検索' }));
            expect(screen.getByText('取得件数は1以上の整数で指定してください')).toBeInTheDocument();
            expect(pushMock).not.toHaveBeenCalled();
            expect(workerRequestMock).toHaveBeenCalledTimes(1);
        },
    );

    it('詳細指定は初期状態で閉じ、開くと全駅が選択されている', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        expect(await screen.findAllByRole('checkbox')).toHaveLength(14);
        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeChecked();
    });

    it('一括操作ボタンは全解除と全選択を切り替え、検索までは条件を適用しない', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        await screen.findByRole('heading', { name: '検索結果' });
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        await user.click(await screen.findByRole('button', { name: '全解除' }));
        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
        expect(screen.queryByRole('button', { name: '全解除' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '検索' }));
        expect(screen.getByText('利用する改札外乗換駅を1つ以上選択してください')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '全選択' }));
        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeChecked();
        expect(screen.getByRole('button', { name: '全解除' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '全選択' })).not.toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
        expect(workerRequestMock).toHaveBeenCalledTimes(1);
        await user.click(screen.getByRole('checkbox', { name: '上野' }));
        await user.click(screen.getByRole('button', { name: '全選択' }));
        expect(screen.getByRole('checkbox', { name: '上野' })).toBeChecked();
        expect(screen.getByRole('button', { name: '全解除' })).toBeInTheDocument();
    });

    it('URLの選択状態を復元し、編集した条件は検索時にURLへ反映する', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={['ueno']}
                queryError={null}
            />,
        );
        await screen.findByRole('heading', { name: '検索結果' });
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        expect(await screen.findByRole('checkbox', { name: '上野' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: '日比谷 / 有楽町' })).not.toBeChecked();
        await user.click(screen.getByRole('checkbox', { name: '日比谷 / 有楽町' }));
        expect(pushMock).not.toHaveBeenCalled();
        expect(workerRequestMock).toHaveBeenCalledTimes(1);
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        await user.click(screen.getByRole('button', { name: '検索' }));
        expect(pushMock).toHaveBeenCalledWith(
            '/tools/tokyometro-transfer-search?from=inaricho&to=iriya&maxOutsideTransfers=1&outsideTransfers=ueno%2Chibiya',
        );
    });

    it('同じ駅の選択条件で再検索するとWorkerへその条件を送る', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={['ueno']}
                queryError={null}
            />,
        );
        await screen.findByRole('heading', { name: '検索結果' });
        await user.click(screen.getByRole('button', { name: '検索' }));
        expect(pushMock).not.toHaveBeenCalled();
        expect(workerRequestMock).toHaveBeenCalledTimes(2);
        expect(workerRequestMock).toHaveBeenLastCalledWith(expect.objectContaining({ outsideTransferIds: ['ueno'] }));
    });

    it('全駅の選択を外して検索するとエラーを表示して遷移しない', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        await user.click(screen.getByRole('button', { name: '詳細指定' }));
        for (const checkbox of await screen.findAllByRole('checkbox')) await user.click(checkbox);
        await user.click(screen.getByRole('button', { name: '検索' }));
        expect(screen.getByText('利用する改札外乗換駅を1つ以上選択してください')).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    beforeEach(() => {
        workerRoute = inarichoToIriyaRoute;
        pushMock.mockClear();
        workerRequestMock.mockClear();
        vi.stubGlobal('Worker', WorkerMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it.each([
        { from: 'ueno', to: 'ueno', type: 'outside', station: '上野', label: '改札外乗換' },
        { from: 'ueno', to: 'ueno', type: 'inside', station: '上野', label: '改札内乗換' },
        { from: 'yurakucho', to: 'hibiya', type: 'outside', station: '有楽町 / 日比谷', label: '改札外乗換' },
        { from: 'hibiya', to: 'yurakucho', type: 'outside', station: '日比谷 / 有楽町', label: '改札外乗換' },
    ] as const)('$station の駅名の後ろに $label を表示する', async ({ from, to, type, station, label }) => {
        workerRoute = {
            ...inarichoToIriyaRoute,
            legs: [
                { ...inarichoToIriyaRoute.legs[0], toStationId: from },
                { ...inarichoToIriyaRoute.legs[1], fromStationId: to },
            ],
            transfers: [{ ...inarichoToIriyaRoute.transfers[0], fromStationId: from, toStationId: to, type }],
        };
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        const results = within(await screen.findByRole('region', { name: '検索結果' }));
        const stationName = results.getByText(station, { exact: true });
        expect(stationName.parentElement).toHaveTextContent(`${station}${label}`);
        expect(results.getAllByText(station, { exact: true })).toHaveLength(1);
    });

    it('初期表示では検索フォームを表示し、結果は表示しない', () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(screen.getByRole('combobox', { name: '乗車駅' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '降車駅' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '最大改札外乗換回数' })).toHaveValue('指定しない');
        expect(screen.queryByRole('heading', { name: '検索結果' })).not.toBeInTheDocument();
    });

    it.each([
        ['乗車駅', 'こうじまち', /^麴町｜/],
        ['降車駅', 'こうじ', /^麴町｜/],
        ['乗車駅', 'おもてさんどう', /^表参道｜/],
        ['降車駅', '麴町', /^麴町｜/],
        ['乗車駅', '有楽町線', /^麴町｜/],
    ])('%sで「%s」を検索して該当駅を選択できる', async (label, query, optionName) => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        const input = screen.getByRole('combobox', { name: label });
        await user.click(input);
        await user.type(input, query);
        await user.click(getActiveOption(input, optionName));
        expect((input as HTMLInputElement).value).toMatch(optionName);
    });

    it('路線名のひらがなでは駅候補を表示しない', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        const input = screen.getByRole('combobox', { name: '乗車駅' });
        await user.click(input);
        await user.type(input, 'ゆうらくちょうせん');
        expect(screen.getByText('該当する駅がありません')).toBeInTheDocument();
    });

    it('駅と最大改札外乗換回数を指定して検索すると共有可能なURLへ遷移する', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        const fromInput = screen.getByRole('combobox', { name: '乗車駅' });
        await user.click(fromInput);
        await user.type(fromInput, '稲荷町');
        await user.click(getActiveOption(fromInput, /^稲荷町｜/));

        const toInput = screen.getByRole('combobox', { name: '降車駅' });
        await user.click(toInput);
        await user.type(toInput, '入谷');
        await user.click(getActiveOption(toInput, /^入谷｜/));

        const maximumOutsideTransferCountInput = screen.getByRole('combobox', { name: '最大改札外乗換回数' });
        await user.click(maximumOutsideTransferCountInput);
        await user.click(getActiveOption(maximumOutsideTransferCountInput, /^1回$/));
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(pushMock).toHaveBeenCalledWith(
            '/tools/tokyometro-transfer-search?from=inaricho&to=iriya&maxOutsideTransfers=1',
        );
    });

    it.each([true, false])(
        '改札内乗換が%sの状態から切り替えても検索ボタン押下までは反映しない',
        async (initialValue) => {
            const user = userEvent.setup();
            renderWithMantine(
                <TokyoMetroTransferSearchPage
                    initialFrom="inaricho"
                    initialTo="iriya"
                    initialMaximumOutsideTransferCount={1}
                    initialIncludeInsideTransfers={initialValue}
                    initialOutsideTransferIds={allOutsideTransferIds}
                    queryError={null}
                />,
            );
            await screen.findByRole('heading', { name: '検索結果' });
            const toggle = screen.getByRole('switch', { name: '改札内乗換を含める' });
            expect(toggle).toHaveProperty('checked', initialValue);
            await user.click(toggle);
            expect(pushMock).not.toHaveBeenCalled();
            expect(workerRequestMock).toHaveBeenCalledTimes(1);
            expect(screen.getByRole('heading', { name: '検索結果' })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: '検索' }));
            expect(pushMock).toHaveBeenCalledWith(
                initialValue
                    ? '/tools/tokyometro-transfer-search?from=inaricho&to=iriya&maxOutsideTransfers=1&includeInsideTransfers=false'
                    : '/tools/tokyometro-transfer-search?from=inaricho&to=iriya&maxOutsideTransfers=1',
            );
        },
    );

    it('発着逆転で選択駅を入れ替える', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );
        await screen.findByRole('heading', { name: '検索結果' });
        const fromInput = screen.getByRole('combobox', { name: '乗車駅' });
        const toInput = screen.getByRole('combobox', { name: '降車駅' });
        await user.click(fromInput);
        await user.clear(fromInput);
        await user.type(fromInput, '銀座');
        await user.click(getActiveOption(fromInput, /^銀座｜/));

        await user.click(screen.getByRole('button', { name: '発着逆転' }));

        expect((fromInput as HTMLInputElement).value).toMatch(/^入谷｜/);
        expect((toInput as HTMLInputElement).value).toMatch(/^銀座｜/);
        expect(screen.getByRole('combobox', { name: '最大改札外乗換回数' })).toHaveValue('1回');
        expect(screen.getByRole('heading', { name: '検索結果' })).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
        expect(workerRequestMock).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: '検索' }));
        expect(pushMock).toHaveBeenCalledWith(
            '/tools/tokyometro-transfer-search?from=iriya&to=ginza&maxOutsideTransfers=1',
        );
    });

    it('乗車駅と降車駅が同じ場合は入力エラーを表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        for (const label of ['乗車駅', '降車駅']) {
            const input = screen.getByRole('combobox', { name: label });
            await user.click(input);
            await user.type(input, '銀座');
            await user.click(getActiveOption(input, /^銀座｜/));
        }

        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(screen.getByText('乗車駅と降車駅には異なる駅を指定してください')).toBeInTheDocument();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('URLで指定された駅の検索結果に乗換回数、運賃、デバッグ情報を表示する', async () => {
        // 稲荷町―入谷には銀座線の稲荷町―上野0.7km、改札外乗換、
        // 日比谷線の上野―入谷1.2kmの候補があるため、
        // 結果一覧には乗換回数・運賃・営業キロを検証できる表示が生じる。
        const user = userEvent.setup();
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="inaricho"
                initialTo="iriya"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByRole('heading', { name: '検索結果' })).toBeInTheDocument();
        expect(workerRequestMock).toHaveBeenCalledWith({
            resultLimit: 20,
            originStationId: 'inaricho',
            destinationStationId: 'iriya',
            maximumOutsideTransferCount: 1,
            includeInsideTransfers: true,
            outsideTransferIds: allOutsideTransferIds,
        });
        expect(screen.getAllByText(/改札外乗換 \d+回/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('IC').length).toBeGreaterThan(0);
        expect(screen.getAllByText('きっぷ').length).toBeGreaterThan(0);

        await user.click(screen.getAllByText('デバッグ情報')[0]);

        expect(screen.getAllByText(/実走営業キロ:/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/運賃計算用最短営業キロ:/).length).toBeGreaterThan(0);
    });

    it.each(['Workerのエラー', '検索処理のエラー'] as const)(
        '%s後に同じ条件で検索し直すと結果を表示する',
        async (failure) => {
            vi.spyOn(WorkerMock.prototype, 'postMessage').mockImplementationOnce(function (this: WorkerMock) {
                queueMicrotask(() => {
                    if (failure === 'Workerのエラー') {
                        this.onerror?.();
                    } else {
                        this.onmessage?.(
                            new MessageEvent('message', {
                                data: { status: 'error', message: '経路検索に失敗しました' },
                            }),
                        );
                    }
                });
            });
            const user = userEvent.setup();
            renderWithMantine(
                <TokyoMetroTransferSearchPage
                    initialFrom="inaricho"
                    initialTo="iriya"
                    initialMaximumOutsideTransferCount={1}
                    initialIncludeInsideTransfers={true}
                    initialOutsideTransferIds={allOutsideTransferIds}
                    queryError={null}
                />,
            );

            expect(await screen.findByText('経路検索に失敗しました')).toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: '検索' }));

            expect(await screen.findByRole('heading', { name: '検索結果' })).toBeInTheDocument();
            expect(screen.queryByText('経路検索に失敗しました')).not.toBeInTheDocument();
        },
    );

    it('改札外乗換を含む経路がない場合は指定のメッセージを表示する', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="ayase"
                initialTo="kita-ayase"
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByText('改札外乗換のルートを構成できません')).toBeInTheDocument();
    });

    it('探索上限に達した場合は結果が探索済み範囲であることを表示する', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="wakoshi"
                initialTo="nishi-funabashi"
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByText('探索上限に達しました')).toBeInTheDocument();
        expect(screen.getByText('見つかった最大は1回です。最大回数は未確定です（上限14回）。')).toBeInTheDocument();
    });

    it('指定上限までの探索が終わっていない場合は候補の回数と上限を表示する', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="wakoshi"
                initialTo="nishi-funabashi"
                initialMaximumOutsideTransferCount={10}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByText('探索上限に達しました')).toBeInTheDocument();
        expect(screen.getByText('見つかった最大は1回です。最大回数は未確定です（上限10回）。')).toBeInTheDocument();
    });

    it('候補の回数が上限に達した場合は最大回数確定と順位未確定を区別する', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="wakoshi"
                initialTo="nishi-funabashi"
                initialMaximumOutsideTransferCount={1}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByText('探索上限に達しました')).toBeInTheDocument();
        expect(
            screen.getByText('最大改札外乗換回数は1回で確定しています。候補の順位は未確定です。'),
        ).toBeInTheDocument();
    });

    it('探索上限に達して候補がない場合は経路が存在しないと断定しない', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom="honancho"
                initialTo="kita-ayase"
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError={null}
            />,
        );

        expect(await screen.findByText('探索上限内では改札外乗換の候補を確認できませんでした')).toBeInTheDocument();
        expect(screen.queryByText('改札外乗換のルートを構成できません')).not.toBeInTheDocument();
    });

    it('URLの駅IDが不正な場合はエラーを表示する', () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                initialMaximumOutsideTransferCount={null}
                initialIncludeInsideTransfers={true}
                initialOutsideTransferIds={allOutsideTransferIds}
                queryError="指定された駅が見つかりません"
            />,
        );

        expect(screen.getByText('指定された駅が見つかりません')).toBeInTheDocument();
    });
});
