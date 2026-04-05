import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { japanAirports } from '@/lib/japan-airport-search/airports';
import { renderWithMantine } from '@/test/test-utils';
import { JapanAirportSearchPage } from './japan-airport-search-page';

describe('JapanAirportSearchPage', () => {
    it('初期状態では空港一覧が表示されること', () => {
        renderWithMantine(<JapanAirportSearchPage />);

        // ヘッダー行があるため+1する
        expect(screen.getAllByRole('row')).toHaveLength(japanAirports.length + 1);
    });

    it('RJTTで検索して東京国際空港が表示されること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<JapanAirportSearchPage />);

        await user.type(screen.getByLabelText('検索'), 'RJTT');

        expect(screen.getByText('東京国際空港')).toBeInTheDocument();
    });
});
