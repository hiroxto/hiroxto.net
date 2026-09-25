import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { TrainNumberCalcPage } from './train-number-calc-page';

describe('TrainNumberCalcPage', () => {
    it('空入力では結果を表示しないこと', () => {
        renderWithMantine(<TrainNumberCalcPage />);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('有効な列車番号を入力すると列車種別を表示する', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TrainNumberCalcPage />);

        await user.type(screen.getByLabelText('列車番号'), '1150');

        expect(screen.getByRole('status')).toHaveTextContent('高速貨C');
    });
});
