import { Table } from '@mantine/core';
import { createdAt2Date, date2String } from '@/lib/swarm-checkin-regulation-checker/functions';
import type { CheckinItem } from '@/lib/swarm-checkin-regulation-checker/types';

type Props = {
    checkins: CheckinItem[];
    limit?: number;
    showReleaseAt: boolean;
    placeHeader: string;
    computeReleaseAt?: (checkin: CheckinItem) => string;
};

export const CheckinTable = ({ checkins, limit, showReleaseAt, placeHeader, computeReleaseAt }: Props) => {
    const rows = checkins.map((checkin, index) => (
        <Table.Tr key={checkin.id} bg={limit != null && index + 1 >= limit ? 'var(--mantine-color-red-0)' : undefined}>
            <Table.Td>{index + 1}</Table.Td>
            <Table.Td>{date2String(createdAt2Date(checkin.createdAt))}</Table.Td>
            <Table.Td>{checkin.venue.name}</Table.Td>
            {showReleaseAt ? <Table.Td>{computeReleaseAt?.(checkin) ?? 'N/A'}</Table.Td> : null}
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>No.</Table.Th>
                    <Table.Th>チェックイン日時</Table.Th>
                    <Table.Th>{placeHeader}</Table.Th>
                    {showReleaseAt ? <Table.Th>規制解除日時</Table.Th> : null}
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    );
};
