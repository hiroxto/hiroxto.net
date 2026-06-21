import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { TimesCarEstimateComparisonPage } from './times-car-estimate-comparison-page';

describe('TimesCarEstimateComparisonPage', () => {
    it('未入力時は比較結果を表示しないこと', () => {
        renderWithMantine(<TimesCarEstimateComparisonPage />);

        expect(screen.queryByRole('heading', { name: '比較結果' })).not.toBeInTheDocument();
    });

    it('通常利用でカーシェア利用料金・レンタカー利用料金・距離・ガソリン単価・燃費を入力すると総額と差額を表示すること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TimesCarEstimateComparisonPage />);

        await user.type(screen.getByLabelText('カーシェア利用料金(円)'), '5000');
        await user.type(screen.getByLabelText('レンタカー利用料金(円)'), '6000');
        await user.type(screen.getByLabelText('利用距離(km)'), '50');
        await user.type(screen.getByLabelText('ガソリン単価(円/L)'), '180');
        await user.type(screen.getByLabelText('燃費(km/L)'), '15');

        expect(screen.getByText('5,600円')).toBeInTheDocument();
        expect(screen.getByText('6,600円')).toBeInTheDocument();
        expect(screen.getByText('カーシェアのほうが1,000円安いです')).toBeInTheDocument();
    });

    it('カーシェア距離料金を全距離課金に切り替えると利用距離全体の距離料金を含む結果を表示すること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TimesCarEstimateComparisonPage />);

        await user.type(screen.getByLabelText('カーシェア利用料金(円)'), '5000');
        await user.type(screen.getByLabelText('レンタカー利用料金(円)'), '6000');
        await user.type(screen.getByLabelText('利用距離(km)'), '50');
        await user.type(screen.getByLabelText('ガソリン単価(円/L)'), '180');
        await user.type(screen.getByLabelText('燃費(km/L)'), '15');
        await user.click(screen.getByLabelText('ナイトパック等: 利用開始時から20円/km'));

        expect(screen.getByText('6,000円')).toBeInTheDocument();
        expect(screen.getByText('カーシェアのほうが600円安いです')).toBeInTheDocument();
    });
});
