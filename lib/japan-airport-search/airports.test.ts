import { describe, expect, it } from 'vitest';
import { japanAirports, searchAirports } from '@/lib/japan-airport-search/airports';

describe('japanAirports', () => {
    it('都道府県コード昇順、同一都道府県内では ICAO 空港コード昇順でソートされていること', () => {
        const sortedAirports = [...japanAirports].sort((left, right) => {
            const prefectureOrder = left.prefectureCode.localeCompare(right.prefectureCode);

            if (prefectureOrder !== 0) {
                return prefectureOrder;
            }

            return left.icaoCode.localeCompare(right.icaoCode);
        });

        for (const [index, airport] of japanAirports.entries()) {
            expect(airport.icaoCode).toBe(sortedAirports[index]?.icaoCode);
        }
    });
});

describe('searchAirports', () => {
    const searchAirportsCases = [
        {
            title: '正式名称の部分一致で検索できること',
            query: '国際',
            expectedIcaoCodes: ['RJAA', 'RJTT', 'RJGG', 'RJBB', 'RJOO'],
        },
        {
            title: '通称の完全一致で検索できること',
            query: '羽田',
            expectedIcaoCodes: ['RJTT'],
        },
        {
            title: 'ICAOコードの完全一致で検索できること',
            query: 'RJTT',
            expectedIcaoCodes: ['RJTT'],
        },
        {
            title: 'IATAコードの完全一致で検索できること',
            query: 'HND',
            expectedIcaoCodes: ['RJTT'],
        },
        {
            title: 'IATAコードの大文字小文字を区別せず検索できること',
            query: 'hnd',
            expectedIcaoCodes: ['RJTT'],
        },
        {
            title: '該当がなければ空配列を返すこと',
            query: 'NOT-FOUND',
            expectedIcaoCodes: [],
        },
    ] as const;

    it('空文字では全件を返すこと', () => {
        expect(searchAirports('')).toHaveLength(japanAirports.length);
    });

    searchAirportsCases.forEach(({ title, query, expectedIcaoCodes }) => {
        it(title, () => {
            expect(searchAirports(query).map((airport) => airport.icaoCode)).toEqual(expectedIcaoCodes);
        });
    });
});
