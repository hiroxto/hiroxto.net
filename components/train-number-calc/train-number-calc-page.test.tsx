import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { TrainNumberCalcPage } from './train-number-calc-page';

describe('TrainNumberCalcPage', () => {
    it('空入力では結果を表示しないこと', () => {
        const { container } = renderWithMantine(<TrainNumberCalcPage />);

        expect(container.querySelector('.mantine-Badge-root')).toBeNull();
    });

    it('正常な数字入力で列車種別を表示すること', async () => {
        const user = userEvent.setup();
        const { container } = renderWithMantine(<TrainNumberCalcPage />);

        await user.type(screen.getByLabelText('列車番号'), '1150');

        expect(container.querySelector('.mantine-Badge-root')).toHaveTextContent('高速貨C');
    });
});
