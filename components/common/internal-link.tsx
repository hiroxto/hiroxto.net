'use client';

import { Anchor, type AnchorProps } from '@mantine/core';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface InternalLinkProps extends Omit<AnchorProps, 'children' | 'component' | 'href'> {
    href: string;
    children: ReactNode;
}

export function InternalLink({ href, children, ...props }: InternalLinkProps) {
    return (
        <Anchor component={Link} href={href} {...props}>
            {children}
        </Anchor>
    );
}
