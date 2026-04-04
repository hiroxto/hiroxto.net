'use client';

import { Stack, Table, TextInput } from '@mantine/core';
import { useDeferredValue, useMemo, useState } from 'react';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { searchAirports } from '@/lib/japan-airport-search/airports';
import { getPrefectureNameByCode } from '@/lib/prefectures';

const formatAliases = (aliases: string[]) => aliases.join(' / ');

export function JapanAirportSearchPage() {
    const [query, setQuery] = useState('');
    const deferredQuery = useDeferredValue(query);
    const filteredAirports = useMemo(() => searchAirports(deferredQuery), [deferredQuery]);

    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: '日本の飛行場・空港検索' }]}
            title="日本の飛行場・空港検索"
            description="日本の飛行場・空港を名称、ICAO空港コード、IATA空港コードで検索できるページ。"
        >
            <Stack gap="lg">
                <section>
                    <TextInput
                        label="検索"
                        placeholder="飛行場名、通称、ICAO、IATAで検索"
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                    />
                </section>

                <section>
                    <div className="overflow-x-auto">
                        <Table striped highlightOnHover withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ICAO空港コード</Table.Th>
                                    <Table.Th>IATA空港コード</Table.Th>
                                    <Table.Th>都道府県</Table.Th>
                                    <Table.Th>飛行場名</Table.Th>
                                    <Table.Th>通称</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredAirports.map((airport) => (
                                    <Table.Tr key={`${airport.icaoCode}:${airport.officialName}`}>
                                        <Table.Td>{airport.icaoCode}</Table.Td>
                                        <Table.Td>{airport.iataCode ?? ''}</Table.Td>
                                        <Table.Td>{getPrefectureNameByCode(airport.prefectureCode) ?? ''}</Table.Td>
                                        <Table.Td>{airport.officialName}</Table.Td>
                                        <Table.Td>{formatAliases(airport.aliases)}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </div>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
