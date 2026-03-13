import type { ContainerProps } from '@mantine/core';
import { Container } from '@mantine/core';
import type { ReactNode } from 'react';

interface SitePageFrameProps {
    children: ReactNode;
    size?: ContainerProps['size'];
    className?: string;
}

export function SitePageFrame({ children, size = 'lg', className }: SitePageFrameProps) {
    return (
        <div className={`bg-white py-8 text-[#161616] ${className ?? ''}`.trim()}>
            <Container size={size}>{children}</Container>
        </div>
    );
}
