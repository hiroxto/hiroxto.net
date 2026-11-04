import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
        expect(screen.queryByRole('img', { name: '走行距離別の合計料金' })).not.toBeInTheDocument();
    });
    it('候補が1つだけなら描画し、閾値比較には2候補が必要と案内する', () => {
        renderChart([candidates[1]]);
        expect(screen.getByRole('img', { name: '走行距離別の合計料金' })).toBeInTheDocument();
        expect(screen.getByText(/最安候補の切替を比較するには、入力済みの候補が2つ以上必要/)).toBeInTheDocument();
    });
    it('未入力の候補を名前付きで案内し、計算できる候補だけ描画する', () => {
        renderChart(candidates, '');
        expect(screen.getByText('未入力または無効な項目がある候補: 1. A')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: '走行距離別の合計料金' })).toBeInTheDocument();
    });
    it('候補がない場合は追加と必要項目の入力を案内する', () => {
        renderChart([]);
        expect(screen.getByText('サービスを追加し、走行距離以外の必要な項目を入力してください。')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
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
});
