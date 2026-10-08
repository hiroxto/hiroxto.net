'use client';

import { Combobox, createTheme, InputWrapper, MantineProvider, v8CssVariablesResolver } from '@mantine/core';
import type { ReactNode } from 'react';

const theme = createTheme({
    // Mantine v8 の角丸と入力ラベルの太さを維持する。
    defaultRadius: 'sm',
    components: {
        InputWrapper: InputWrapper.extend({ styles: { label: { fontWeight: 500 } } }),
        Combobox: Combobox.extend({ styles: { groupLabel: { fontWeight: 500 } } }),
    },
});

export function SiteMantineProvider({ children }: { children: ReactNode }) {
    return (
        <MantineProvider theme={theme} cssVariablesResolver={v8CssVariablesResolver}>
            {children}
        </MantineProvider>
    );
}
