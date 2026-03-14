import { MantineProvider } from '@mantine/core';
import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

function TestProvider({ children }: { children: ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>;
}

export function renderWithMantine(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, {
        wrapper: TestProvider,
        ...options,
    });
}
