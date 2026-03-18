import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { Output } from './output';
import { useRouteStateStore } from './stores/route-state-store';

describe('Output', () => {
    beforeEach(() => {
        useRouteStateStore.setState({
            type: '片道乗車券',
            month: '3',
            day: '14',
            dateOption: 'use',
            departure: '東京',
            destination: '博多',
            routes: [
                { id: '1', line: '東海道線', station: '名古屋' },
                { id: '2', line: '', station: '空行' },
                { id: '3', line: '山陽線', station: '' },
            ],
            notes: '  メモ  ',
        });
    });

    it('空の路線を除外し、日付と備考を整形して表示すること', () => {
        renderWithMantine(<Output />);

        const output = screen.getByText(
            (content) => content.includes('片道乗車券') && content.includes('区間: 東京→博多'),
        );
        expect(output).toHaveTextContent('利用開始日: 3月14日');
        expect(output).toHaveTextContent('東海道線');
        expect(output).toHaveTextContent('名古屋');
        expect(output).toHaveTextContent('山陽線');
        expect(output).not.toHaveTextContent('空行');
        expect(output).toHaveTextContent('備考: メモ');
    });

    it('dateOption=skip かつ空備考では余計な文言を表示しないこと', () => {
        useRouteStateStore.setState({
            dateOption: 'skip',
            notes: '',
        });

        renderWithMantine(<Output />);

        const output = screen.getByText((content) => content.includes('区間: 東京→博多'));
        expect(output).not.toHaveTextContent('利用開始日');
        expect(output).not.toHaveTextContent('備考:');
    });
});
