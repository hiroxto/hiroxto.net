import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CarshareRentacarEstimateComparisonPage } from './carshare-rentacar-estimate-comparison-page';

describe('CarshareRentacarEstimateComparisonPage', () => {
    it('走行距離が空欄でも条件を入力した候補をグラフに表示し、料金の変更を反映する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.click(screen.getByRole('button', { name: 'タイムズカーを追加' }));
        await user.type(screen.getByLabelText('カーシェア利用料金(円)'), '5000');
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        const graph = within(screen.getByRole('region', { name: '距離別の料金比較' }));
        expect(graph.getByRole('img', { name: '走行距離別の合計料金' })).toBeInTheDocument();
        expect(graph.getByText('最安: 1. タイムズカー 1')).toBeInTheDocument();
        await user.clear(screen.getByLabelText('カーシェア利用料金(円)'));
        await user.type(screen.getByLabelText('カーシェア利用料金(円)'), '10000');
        expect(graph.getByText('この範囲内では最安候補の切替はありません。')).toBeInTheDocument();
        expect(graph.getByText('最安: 2. トヨタシェア 1')).toBeInTheDocument();
        expect(screen.getByLabelText('走行距離(km)')).toHaveValue('');
    });

    it.each(['レンタカー', 'タイムズカー', 'トヨタシェア'])(
        '%sのラベルをクリックして編集し、フォーカスを外すとそのカードだけ変更する',
        async (service) => {
            const user = userEvent.setup();
            render(
                <MantineProvider env="test">
                    <CarshareRentacarEstimateComparisonPage />
                </MantineProvider>,
            );
            await user.click(screen.getByRole('button', { name: `${service}を追加` }));
            await user.click(screen.getByRole('button', { name: `${service}を追加` }));
            const first = within(screen.getByRole('region', { name: `${service} 1` }));
            await user.click(first.getByRole('button', { name: `${service} 1のラベルを編集` }));
            const input = first.getByRole('textbox', { name: 'サービスのラベル' });
            expect(input).toHaveFocus();
            expect(input).toHaveValue(`${service} 1`);
            await user.clear(input);
            await user.type(input, '新宿駅前店');
            expect(screen.getByRole('region', { name: `${service} 1` })).toBeInTheDocument();
            await user.tab();
            expect(screen.queryByRole('textbox', { name: 'サービスのラベル' })).not.toBeInTheDocument();
            const renamed = within(screen.getByRole('region', { name: '新宿駅前店' }));
            expect(renamed.getByRole('heading', { name: '新宿駅前店' })).toBeInTheDocument();
            expect(screen.getByRole('region', { name: `${service} 2` })).toBeInTheDocument();
            await user.click(screen.getByRole('button', { name: `${service}を追加` }));
            expect(screen.getByRole('region', { name: `${service} 3` })).toBeInTheDocument();
            await user.click(renamed.getByRole('button', { name: '新宿駅前店を削除' }));
            expect(screen.queryByRole('region', { name: '新宿駅前店' })).not.toBeInTheDocument();
        },
    );

    it.each(['', '   '])('ラベルを%jにしてフォーカスを外すと変更前のラベルを維持する', async (value) => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.click(screen.getByRole('button', { name: 'レンタカーを追加' }));
        await user.click(screen.getByRole('button', { name: 'レンタカー 1のラベルを編集' }));
        const input = screen.getByRole('textbox', { name: 'サービスのラベル' });
        await user.clear(input);
        await user.type(input, '東京店');
        await user.tab();
        await user.click(screen.getByRole('button', { name: '東京店のラベルを編集' }));
        const editing = screen.getByRole('textbox', { name: 'サービスのラベル' });
        await user.clear(editing);
        if (value) await user.type(editing, value);
        await user.tab();
        expect(screen.getByRole('heading', { name: '東京店' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '東京店のラベルを編集' }));
        expect(screen.getByRole('textbox', { name: 'サービスのラベル' })).toHaveValue('東京店');
    });

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
    it('最安が同額なら両方に表示し、一方を削除して計算済みが1件になると最安表示を消す', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <CarshareRentacarEstimateComparisonPage />
            </MantineProvider>,
        );
        await user.type(screen.getByLabelText('走行距離(km)'), '50');
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        expect(screen.getAllByText('入力済みで最安（同額）')).toHaveLength(2);
        await user.click(screen.getByRole('button', { name: 'トヨタシェア 1を削除' }));
        expect(screen.queryByText(/入力済みで最安/)).not.toBeInTheDocument();
        expect(screen.queryByText(/最安との差額/)).not.toBeInTheDocument();
        expect(screen.getByText('6,740円')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'トヨタシェア 2を削除' }));
        expect(
            screen.getByText('比較したいサービスを追加してください。1つだけでも概算を確認できます。'),
        ).toBeInTheDocument();
    });

    it('共通のガソリン単価を空欄にするとレンタカーだけを未計算にし、再入力で料金を復元する', async () => {
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
        await user.click(screen.getByRole('button', { name: 'トヨタシェアを追加' }));
        await user.type(screen.getByLabelText('レンタカー利用料金(円)'), '6000');
        const rental = within(screen.getByRole('region', { name: 'レンタカー 1' }));
        const toyota = within(screen.getByRole('region', { name: 'トヨタシェア 1' }));
        expect(rental.getByText('6,600円')).toBeInTheDocument();
        await user.clear(screen.getByLabelText('ガソリン単価(円/L)'));
        expect(rental.getByText('必要な項目を入力すると表示します。')).toBeInTheDocument();
        expect(toyota.getByText('6,740円')).toBeInTheDocument();
        expect(screen.queryByText(/入力済みで最安/)).not.toBeInTheDocument();
        await user.type(screen.getByLabelText('ガソリン単価(円/L)'), '180');
        expect(rental.getByText('6,600円')).toBeInTheDocument();
        expect(toyota.getByText('最安との差額 140円')).toBeInTheDocument();
    });
});
