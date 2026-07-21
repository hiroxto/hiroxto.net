import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteResult } from '@/lib/tokyometro-transfer-search/search';
import type { RouteSearchRequest, RouteSearchResponse } from '@/lib/tokyometro-transfer-search/search-worker-protocol';
import { renderWithMantine } from '@/test/test-utils';
import { TokyoMetroTransferSearchPage } from './tokyometro-transfer-search-page';

const pushMock = vi.fn();

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

class WorkerMock {
    onmessage: ((event: MessageEvent<RouteSearchResponse>) => void) | null = null;
    onerror: (() => void) | null = null;

    postMessage(request: RouteSearchRequest) {
        const routes =
            request.originStationId === 'ayase' && request.destinationStationId === 'kita-ayase'
                ? []
                : [inarichoToIriyaRoute];

        queueMicrotask(() => {
            this.onmessage?.(new MessageEvent('message', { data: { status: 'success', routes } }));
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
    beforeEach(() => {
        pushMock.mockClear();
        vi.stubGlobal('Worker', WorkerMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('初期表示では検索フォームとデータ基準日を表示し、結果は表示しない', () => {
        renderWithMantine(<TokyoMetroTransferSearchPage initialFrom={null} initialTo={null} queryError={null} />);

        expect(screen.getByRole('textbox', { name: '乗車駅' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: '降車駅' })).toBeInTheDocument();
        expect(screen.getByText('営業キロ・運賃は2026/07/22時点の情報')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: '検索結果' })).not.toBeInTheDocument();
    });

    it('駅を指定して検索すると共有可能なURLへ遷移する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TokyoMetroTransferSearchPage initialFrom={null} initialTo={null} queryError={null} />);

        const fromInput = screen.getByRole('textbox', { name: '乗車駅' });
        await user.click(fromInput);
        await user.type(fromInput, '稲荷町');
        await user.click(getActiveOption(fromInput, /^稲荷町｜/));

        const toInput = screen.getByRole('textbox', { name: '降車駅' });
        await user.click(toInput);
        await user.type(toInput, '入谷');
        await user.click(getActiveOption(toInput, /^入谷｜/));
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(pushMock).toHaveBeenCalledWith('/tools/tokyometro-transfer-search?from=inaricho&to=iriya');
    });

    it('乗車駅と降車駅が同じ場合は入力エラーを表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TokyoMetroTransferSearchPage initialFrom={null} initialTo={null} queryError={null} />);

        for (const label of ['乗車駅', '降車駅']) {
            const input = screen.getByRole('textbox', { name: label });
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
        renderWithMantine(<TokyoMetroTransferSearchPage initialFrom="inaricho" initialTo="iriya" queryError={null} />);

        expect(await screen.findByRole('heading', { name: '検索結果' })).toBeInTheDocument();
        expect(screen.getAllByText(/改札外乗換 \d+回/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('IC').length).toBeGreaterThan(0);
        expect(screen.getAllByText('きっぷ').length).toBeGreaterThan(0);

        await user.click(screen.getAllByText('デバッグ情報')[0]);

        expect(screen.getAllByText(/実走営業キロ:/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/運賃計算用最短営業キロ:/).length).toBeGreaterThan(0);
    });

    it('改札外乗換を含む経路がない場合は指定のメッセージを表示する', async () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage initialFrom="ayase" initialTo="kita-ayase" queryError={null} />,
        );

        expect(await screen.findByText('改札外乗換のルートを構成できません')).toBeInTheDocument();
    });

    it('URLの駅IDが不正な場合はエラーを表示する', () => {
        renderWithMantine(
            <TokyoMetroTransferSearchPage
                initialFrom={null}
                initialTo={null}
                queryError="指定された駅が見つかりません"
            />,
        );

        expect(screen.getByText('指定された駅が見つかりません')).toBeInTheDocument();
    });
});
