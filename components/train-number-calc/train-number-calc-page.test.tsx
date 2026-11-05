import { fireEvent, screen } from '@testing-library/react';
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

    it.each(['５０９４', '5０9４'])('入力「%s」を保持したまま高速貨Bを表示する', async (input) => {
        const user = userEvent.setup();
        renderWithMantine(<TrainNumberCalcPage />);
        const field = screen.getByLabelText('列車番号');

        await user.type(field, input);

        expect(field).toHaveValue(input);
        expect(screen.getByRole('status')).toHaveTextContent('高速貨B');
        expect(field).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('全角数字の変換中と確定後も入力文字列を保持する', () => {
        renderWithMantine(<TrainNumberCalcPage />);
        const field = screen.getByLabelText('列車番号');

        fireEvent.compositionStart(field);
        fireEvent.change(field, { target: { value: '５０９４' } });
        expect(field).toHaveValue('５０９４');
        fireEvent.compositionEnd(field, { data: '５０９４' });

        expect(field).toHaveValue('５０９４');
        expect(screen.getByRole('status')).toHaveTextContent('高速貨B');
    });

    it('有効な入力を全角先頭0に変更するとエラーを表示し結果を消す', async () => {
        const user = userEvent.setup();
        renderWithMantine(<TrainNumberCalcPage />);
        const field = screen.getByLabelText('列車番号');
        await user.type(field, '５０９４');
        expect(screen.getByRole('status')).toHaveTextContent('高速貨B');

        await user.clear(field);
        await user.type(field, '０１２３');

        expect(screen.getByText('先頭を0にすることはできません。')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        await user.clear(field);
        expect(field).toHaveValue('');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByText('先頭を0にすることはできません。')).not.toBeInTheDocument();
    });
});
