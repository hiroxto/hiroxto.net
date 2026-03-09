'use client';

import { DatesProvider } from '@mantine/dates';
import type { ReactNode } from 'react';

interface FareTicketRoutePlannerDatesProviderProps {
    children: ReactNode;
}

export function FareTicketRoutePlannerDatesProvider({ children }: FareTicketRoutePlannerDatesProviderProps) {
    return <DatesProvider settings={{ locale: 'ja' }}>{children}</DatesProvider>;
}
