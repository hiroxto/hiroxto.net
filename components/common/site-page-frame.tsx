import { Container } from '@mantine/core';
import type { ReactNode } from 'react';

interface SitePageFrameProps {
    children: ReactNode;
}

export function SitePageFrame({ children }: SitePageFrameProps) {
    return (
        <div className="bg-white py-8 text-[#161616]">
            <Container size="lg">{children}</Container>
        </div>
    );
}
