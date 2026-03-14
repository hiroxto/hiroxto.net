import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { SiteBreadcrumbs } from './site-breadcrumbs';

describe('SiteBreadcrumbs', () => {
    it('href がある要素はリンクとして描画すること', () => {
        renderWithMantine(<SiteBreadcrumbs items={[{ label: 'トップ', href: '/' }, { label: '現在地' }]} />);

        expect(screen.getByRole('link', { name: 'トップ' })).toHaveAttribute('href', '/');
        expect(screen.getByText('現在地')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: '現在地' })).not.toBeInTheDocument();
    });
});
