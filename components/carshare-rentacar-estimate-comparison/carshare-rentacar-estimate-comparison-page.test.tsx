import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CarshareRentacarEstimateComparisonPage } from './carshare-rentacar-estimate-comparison-page';

describe('CarshareRentacarEstimateComparisonPage', () => {
    it('タイムズカーを複数追加すると料金と課金方式を個別に入力でき、一方を削除しても他方の入力が残る', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.type(screen.getByLabelText('走行距離(km)'), '50');
        await user.click(screen.getByRole('button', { name: 'タイムズカーを追加' }));
        await user.click(screen.getByRole('button', { name: 'タイムズカーを追加' }));
        const first = within(screen.getByRole('region', { name: 'タイムズカー 1' }));
        const second = within(screen.getByRole('region', { name: 'タイムズカー 2' }));
        await user.type(first.getByLabelText('カーシェア利用料金(円)'), '5000');
        await user.type(second.getByLabelText('カーシェア利用料金(円)'), '6000');
        await user.click(second.getByLabelText('ナイトパック等: 利用開始時から20円/km'));
        expect(first.getByText('5,600円')).toBeInTheDocument();
        expect(second.getByText('7,000円')).toBeInTheDocument();
        await user.click(first.getByRole('button', { name: 'タイムズカー 1を削除' }));
        expect(screen.queryByRole('region', { name: 'タイムズカー 1' })).not.toBeInTheDocument();
        expect(second.getByLabelText('カーシェア利用料金(円)')).toHaveValue('6,000');
        expect(second.getByText('7,000円')).toBeInTheDocument();
    });

    it('レンタカーを複数追加すると料金を個別に入力でき、共通の走行条件で再計算される', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.type(screen.getByLabelText('走行距離(km)'), '50');
        await user.type(screen.getByLabelText('ガソリン単価(円/L)'), '180');
        await user.type(screen.getByLabelText('燃費(km/L)'), '15');
        await user.click(screen.getByRole('button', { name: 'レンタカーを追加' }));
        await user.click(screen.getByRole('button', { name: 'レンタカーを追加' }));
        const first = within(screen.getByRole('region', { name: 'レンタカー 1' }));
        const second = within(screen.getByRole('region', { name: 'レンタカー 2' }));
        await user.type(first.getByLabelText('レンタカー利用料金(円)'), '6000');
        await user.type(second.getByLabelText('レンタカー利用料金(円)'), '7000');
        expect(first.getByText('6,600円')).toBeInTheDocument();
        expect(second.getByText('7,600円')).toBeInTheDocument();
        await user.clear(screen.getByLabelText('走行距離(km)'));
        await user.type(screen.getByLabelText('走行距離(km)'), '100');
        expect(first.getByText('7,200円')).toBeInTheDocument();
        expect(second.getByText('8,200円')).toBeInTheDocument();
    });

    it('トヨタシェアを複数追加すると料金プランと利用時間を個別に保持する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.type(screen.getByLabelText('走行距離(km)'), '50');
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        const first = within(screen.getByRole('region', { name: 'トヨタシェア 1' }));
        const second = within(screen.getByRole('region', { name: 'トヨタシェア 2' }));
        await user.click(first.getByRole('combobox', { name: '料金プラン' }));
        await user.click(await screen.findByRole('option', { name: 'ショート（15分220円）' }));
        await user.type(first.getByLabelText('利用時間(時間)'), '3');
        expect(first.getByText('2,640円')).toBeInTheDocument();
        expect(second.queryByLabelText('利用時間(時間)')).not.toBeInTheDocument();
        expect(second.getByText('6,740円')).toBeInTheDocument();
        await user.click(second.getByRole('combobox', { name: '料金プラン' }));
        await user.click(await screen.findByRole('option', { name: 'ショート（15分220円）' }));
        await user.type(second.getByLabelText('利用時間(時間)'), '6');
        expect(first.getByText('2,640円')).toBeInTheDocument();
        expect(second.getByText('5,280円')).toBeInTheDocument();
    });

    it('未入力の比較対象があっても入力済みの対象で最安との差額を表示する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.type(screen.getByLabelText('走行距離(km)'), '50');
        await user.click(screen.getByRole('button', { name: 'タイムズカーを追加' }));
        await user.click(screen.getByRole('button', { name: 'レンタカーを追加' }));
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        await user.type(screen.getByLabelText('カーシェア利用料金(円)'), '5000');
        const toyota = within(screen.getByRole('region', { name: 'トヨタシェア 1' }));
        expect(screen.getByText('5,600円')).toBeInTheDocument();
        expect(toyota.getByText('最安との差額 1,140円')).toBeInTheDocument();
        expect(
            within(screen.getByRole('region', { name: 'レンタカー 1' })).getByText(
                '必要な項目を入力すると表示します。',
            ),
        ).toBeInTheDocument();
    });
});
