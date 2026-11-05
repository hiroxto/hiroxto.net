import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DistanceCandidate } from '@/lib/carshare-rentacar-estimate-comparison/distance-comparison';
import { DistanceComparisonChart } from './distance-comparison-chart';

const candidates: DistanceCandidate[] = [
    { id: 'a', label: 'A', service: 'rentalCar', usageFee: 100, allDistance: false, toyotaPlan: '12', toyotaHours: '' },
    { id: 'b', label: 'B', service: 'timesCar', usageFee: 102, allDistance: false, toyotaPlan: '12', toyotaHours: '' },
];
const renderChart = (entries = candidates, gasolinePrice: number | string = 1) =>
    render(
        <MantineProvider env="test">
            <DistanceComparisonChart candidates={entries} gasolinePrice={gasolinePrice} fuelEfficiency={1} />
        </MantineProvider>,
    );

describe('DistanceComparisonChart', () => {
    beforeEach(() => {
        // jsdomにはレイアウトがないため、ブラウザの測定結果だけを補う。グラフ本体は実物を使う。
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const contentHeight = this.tagName === 'SPAN' ? 16 : 300;
            const height = this.classList.contains('recharts-legend-wrapper') ? 40 : contentHeight;
            const width = this.tagName === 'SPAN' ? (this.textContent?.length || 1) * 7 : 640;
            return { width, height, top: 0, left: 0, right: 640, bottom: height, x: 0, y: 0, toJSON: () => ({}) };
        });
    });
    afterEach(() => vi.restoreAllMocks());
    it('範囲を変更すると同額帯と全ての切替地点を更新し、無効な範囲は描画しない', async () => {
        const user = userEvent.setup();
        renderChart();
        await user.clear(screen.getByLabelText('グラフの上限(km)'));
        await user.type(screen.getByLabelText('グラフの上限(km)'), '5');
        const bands = within(screen.getByRole('list', { name: '距離ごとの最安候補' }));
        expect(bands.getAllByRole('listitem')).toHaveLength(3);
        expect(bands.getByText('1.5〜2.4km')).toBeInTheDocument();
        expect(bands.getByText('同額で最安: 1. A、2. B')).toBeInTheDocument();
        expect(bands.getByText('切替地点: 2.5km')).toBeInTheDocument();
        await user.clear(screen.getByLabelText('グラフの下限(km)'));
        await user.type(screen.getByLabelText('グラフの下限(km)'), '6');
        expect(screen.getByRole('alert')).toHaveTextContent('上限は下限より大きく');
        expect(screen.queryByRole('figure', { name: '走行距離別の合計料金' })).not.toBeInTheDocument();
    });
    it('候補が1つだけなら描画し、閾値比較には2候補が必要と案内する', () => {
        renderChart([candidates[1]]);
        expect(screen.getByRole('figure', { name: '走行距離別の合計料金' })).toBeInTheDocument();
        expect(screen.getByText(/最安候補の切替を比較するには、入力済みの候補が2つ以上必要/)).toBeInTheDocument();
    });
    it('未入力の候補を名前付きで案内し、計算できる候補だけ描画する', () => {
        renderChart(candidates, '');
        expect(screen.getByText('未入力または無効な項目がある候補: 1. A')).toBeInTheDocument();
        expect(screen.getByRole('figure', { name: '走行距離別の合計料金' })).toBeInTheDocument();
    });
    it('候補がない場合は追加と必要項目の入力を案内する', () => {
        renderChart([]);
        expect(screen.getByText('サービスを追加し、走行距離以外の必要な項目を入力してください。')).toBeInTheDocument();
        expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    });
    it('全区間同額なら変化なしと同額の全候補を表示する', () => {
        renderChart([{ ...candidates[1], id: 'a', label: 'A' }, candidates[1]]);
        expect(screen.getByText('この範囲内では最安候補の切替はありません。')).toBeInTheDocument();
        expect(screen.getByText('同額で最安: 1. A、2. B')).toBeInTheDocument();
    });
    it('円丸めで切替が多数発生しても区間一覧をページ分けして全件読める', async () => {
        const user = userEvent.setup();
        renderChart(
            [
                { ...candidates[0], usageFee: 5610 },
                { ...candidates[1], service: 'toyotaShare', toyotaPlan: '6' },
            ],
            16.001,
        );
        const list = screen.getByRole('list', { name: '距離ごとの最安候補' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(20);
        const first = list.textContent;
        await user.click(screen.getByRole('button', { name: '次の20区間' }));
        expect(list.textContent).not.toBe(first);
        expect(screen.getByRole('button', { name: '前の20区間' })).toBeEnabled();
    });
    it.each([
        [0, 0.1, ['0', '0.1']],
        [12.3, 12.4, ['12.3', '12.4']],
    ])('範囲%s〜%skmでも横軸の両端を区別して表示する', async (min, max, labels) => {
        renderChart();
        fireEvent.change(screen.getByLabelText('グラフの上限(km)'), { target: { value: String(max) } });
        fireEvent.change(screen.getByLabelText('グラフの下限(km)'), { target: { value: String(min) } });
        const chart = within(screen.getByRole('figure', { name: '走行距離別の合計料金' }));
        expect(await chart.findByText(labels[0], { selector: 'tspan' })).toBeInTheDocument();
        expect(chart.getByText(labels[1], { selector: 'tspan' })).toBeInTheDocument();
        expect(chart.getByText('走行距離(km)')).toBeInTheDocument();
        expect(chart.getByText('合計料金(円)')).toBeInTheDocument();
    });
    it('キーボードで選んだ距離の料金に候補名と円単位を表示する', async () => {
        const user = userEvent.setup();
        renderChart();
        fireEvent.change(screen.getByLabelText('グラフの上限(km)'), { target: { value: '5' } });
        const chart = screen.getByRole('application');
        chart.focus();
        await user.keyboard('{ArrowRight}');
        expect(await screen.findByText('0.1km')).toBeInTheDocument();
        expect(screen.getByText('100円')).toBeInTheDocument();
        expect(screen.getByText('102円')).toBeInTheDocument();
        expect(screen.getAllByText('1. A').length).toBeGreaterThan(0);
        expect(screen.getAllByText('2. B').length).toBeGreaterThan(0);
    });
    it('252候補でも最後の候補まで凡例と選択距離の料金を確認できる', async () => {
        const user = userEvent.setup();
        renderChart(
            Array.from({ length: 252 }, (_, index) => ({
                ...candidates[1],
                id: `candidate-${index}`,
                label: `候補${index}`,
                usageFee: index === 251 ? 100000 : 100,
            })),
        );
        const chart = within(screen.getByRole('figure', { name: '走行距離別の合計料金' }));
        expect(await chart.findByText('1. 候補0')).toBeInTheDocument();
        expect(chart.getByText('252. 候補251')).toBeInTheDocument();
        screen.getByRole('application').focus();
        await user.keyboard('{ArrowRight}');
        expect(await chart.findByText('100,000円')).toBeInTheDocument();
    });
});
