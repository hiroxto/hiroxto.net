import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { SiteMantineProvider } from '@/components/common/site-mantine-provider';

function TestProvider({ children }: { children: ReactNode }) {
    return <SiteMantineProvider>{children}</SiteMantineProvider>;
}

export function renderWithMantine(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, {
        wrapper: TestProvider,
        ...options,
    });
}
