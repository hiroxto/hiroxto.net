import { MantineProvider } from '@mantine/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TokyoMetroTransferRoutePlannerPage } from './tokyometro-transfer-route-planner-page';

type User = ReturnType<typeof userEvent.setup>;
const choose = async (user: User, label: string, name: RegExp) => {
    const input = screen.getByRole('combobox', { name: label });
    await user.click(input);
    await user.click(await screen.findByRole('option', { name }));
};
const station = async (user: User, label: string, query: string) => {
    const input = screen.getByRole('combobox', { name: label });
    await user.click(input);
    await user.clear(input);
    await user.type(input, query);
    await user.click(await screen.findByRole('option', { name: new RegExp(`^${query}｜`) }));
};
const endpoints = async (user: User, from: string, to: string) => {
    await station(user, '乗車駅', from);
    await station(user, '降車駅', to);
};

describe('改札外乗換経路作成の画面', () => {
    it('選択済み発駅の検索文字を変更しても確定済みの発着駅と経路を保持する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '浅草');
        await choose(user, '経路1の接続駅', /^浅草$/);
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
        const input = screen.getByRole('combobox', { name: '乗車駅' }) as HTMLInputElement;
        await user.click(input);
        input.setSelectionRange(0, input.value.length);
        await user.paste('存在しない駅');
        expect(input).toHaveValue('存在しない駅');
        expect(screen.getByText('選択肢から駅を指定してください')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('浅草');
    });
    it('接続駅の選択後に路線を自動入力し、完成結果と逆転後の結果を表示する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        expect(screen.getByRole('combobox', { name: '経路1の路線' })).toHaveValue('銀座線');
        await choose(user, '経路1の接続駅', /^上野$/);
        expect(screen.getByRole('combobox', { name: '経路2の路線' })).toHaveValue('日比谷線');
        expect(screen.queryByRole('region', { name: '作成結果' })).not.toBeInTheDocument();
        await choose(user, '経路2の接続駅', /^入谷$/);
        const result = screen.getByRole('region', { name: '作成結果' });
        expect(within(result).getByText('改札外乗換 1回')).toBeInTheDocument();
        expect(within(result).getByText('178円')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '発着逆転' }));
        expect(screen.getByRole('combobox', { name: '乗車駅' })).toHaveValue('入谷｜日比谷線');
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('上野');
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
    });
    it('異駅名乗換では行間に前後の駅名と乗換種別を表示する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '京橋', '新富町');
        await choose(user, '経路1の接続駅', /^銀座$/);
        await choose(user, '経路2の路線', /^有楽町線$/);
        expect(screen.getByText('銀座 → 銀座一丁目')).toBeInTheDocument();
        await choose(user, '経路2の接続駅', /^新富町$/);
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '経路1のこの先を削除' }));
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('銀座');
        expect(screen.queryByRole('region', { name: '作成結果' })).not.toBeInTheDocument();
    });
    it('到達できない接続駅を無効にし、選択操作でも入力を進めない', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '綾瀬', '北綾瀬');
        await user.click(screen.getByRole('combobox', { name: '経路1の接続駅' }));
        const disabled = screen.getByRole('option', { name: /^北千住/ });
        expect(disabled).toHaveAttribute('data-combobox-disabled', 'true');
        await user.click(disabled);
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('');
    });
    it('未完成経路の逆転を取り消すと入力を保持し、承諾すると破棄して交換する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        await user.click(screen.getByRole('button', { name: '発着逆転' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('経路が完成していないため逆転できません');
        await user.click(screen.getByRole('button', { name: 'キャンセル' }));
        expect(screen.getByRole('combobox', { name: '乗車駅' })).toHaveValue('稲荷町｜銀座線');
        await user.click(screen.getByRole('button', { name: '発着逆転' }));
        await user.click(screen.getByRole('button', { name: '経路を破棄して逆転' }));
        expect(screen.getByRole('combobox', { name: '乗車駅' })).toHaveValue('入谷｜日比谷線');
        expect(screen.getByRole('combobox', { name: '経路1の路線' })).toHaveValue('日比谷線');
    });
    it('大手町の乗換種別は選択欄を出さず改札外として自動集計する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '東京', '竹橋');
        await choose(user, '経路1の接続駅', /^大手町$/);
        await choose(user, '経路2の路線', /^東西線$/);
        await choose(user, '経路2の接続駅', /^竹橋$/);
        expect(screen.getByRole('region', { name: '作成結果' })).toHaveTextContent('改札外乗換 1回');
        expect(screen.queryByRole('combobox', { name: '経路2の乗換種別' })).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '経路2の接続駅' })).toHaveValue('竹橋');
        expect(screen.getByRole('region', { name: '作成結果' })).toHaveTextContent('改札内乗換 0回');
    });
    it('新しい降車駅まで同じ経路を構成できれば入力を保持して最終駅だけ変更する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        await choose(user, '経路1の接続駅', /^上野$/);
        await choose(user, '経路2の接続駅', /^入谷$/);
        await station(user, '降車駅', '三ノ輪');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('上野');
        expect(screen.getByRole('combobox', { name: '経路2の接続駅' })).toHaveValue('三ノ輪');
        expect(screen.getByRole('region', { name: '作成結果' })).toHaveTextContent('改札外乗換 1回');
    });
    it('検索して確定済みの駅を選び直しても選択解除や経路破棄を行わない', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        await choose(user, '経路1の接続駅', /^上野$/);
        await choose(user, '経路2の接続駅', /^入谷$/);
        await station(user, '降車駅', '入谷');
        await user.tab();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: '降車駅' })).toHaveValue('入谷｜日比谷線');
        expect(screen.getByRole('combobox', { name: '経路2の接続駅' })).toHaveValue('入谷');
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
    });
    it('経路を構成できない発着変更をキャンセルすると発着駅と経路を保持する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        await choose(user, '経路1の接続駅', /^上野$/);
        await choose(user, '経路2の接続駅', /^入谷$/);
        await station(user, '降車駅', '浅草');
        expect(screen.getByRole('dialog')).toHaveTextContent('入力済みの経路を構成できません');
        await user.click(screen.getByRole('button', { name: 'キャンセル' }));
        expect(screen.getByRole('combobox', { name: '乗車駅' })).toHaveValue('稲荷町｜銀座線');
        expect(screen.getByRole('combobox', { name: '降車駅' })).toHaveValue('入谷｜日比谷線');
        expect(screen.getByRole('combobox', { name: '経路2の接続駅' })).toHaveValue('入谷');
        expect(screen.getByRole('region', { name: '作成結果' })).toBeInTheDocument();
    });
    it('経路破棄を承諾した場合だけ新しい発着駅を適用して経路を初期化する', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await endpoints(user, '稲荷町', '入谷');
        await choose(user, '経路1の接続駅', /^上野$/);
        await choose(user, '経路2の接続駅', /^入谷$/);
        await station(user, '降車駅', '浅草');
        await user.click(screen.getByRole('button', { name: '経路を破棄して変更' }));
        expect(screen.getByRole('combobox', { name: '降車駅' })).toHaveValue('浅草｜銀座線');
        expect(screen.getByRole('combobox', { name: '経路1の接続駅' })).toHaveValue('');
        expect(screen.queryByRole('combobox', { name: '経路2の接続駅' })).not.toBeInTheDocument();
        expect(screen.queryByRole('region', { name: '作成結果' })).not.toBeInTheDocument();
    });
    it('存在しない駅の入力にはエラーを表示し経路を入力できない', async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider env="test">
                <TokyoMetroTransferRoutePlannerPage />
            </MantineProvider>,
        );
        await user.type(screen.getByRole('combobox', { name: '乗車駅' }), '存在しない駅');
        expect(screen.getByText('選択肢から駅を指定してください')).toBeInTheDocument();
        expect(screen.queryByRole('combobox', { name: '経路1の路線' })).not.toBeInTheDocument();
    });
});
