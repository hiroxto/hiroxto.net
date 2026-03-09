import '@mantine/dates/styles.css';
import type { ReactNode } from 'react';
import { FareTicketRoutePlannerDatesProvider } from '@/components/fare-ticket-route-planner/fare-ticket-route-planner-dates-provider';

interface FareTicketRoutePlannerLayoutProps {
    children: ReactNode;
}

export default function FareTicketRoutePlannerLayout({ children }: FareTicketRoutePlannerLayoutProps) {
    return <FareTicketRoutePlannerDatesProvider>{children}</FareTicketRoutePlannerDatesProvider>;
}
