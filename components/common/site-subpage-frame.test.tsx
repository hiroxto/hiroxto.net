import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { SiteSubpageFrame } from './site-subpage-frame';

describe('SiteSubpageFrame', () => {
    it('トップページのパンくずを自動付与すること', () => {
        renderWithMantine(
            <SiteSubpageFrame items={[{ label: 'ツール一覧', href: '/tools' }, { label: 'QRコード生成' }]}>
                <div>body</div>
            </SiteSubpageFrame>,
        );

        expect(screen.getByRole('link', { name: 'トップページ' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'ツール一覧' })).toHaveAttribute('href', '/tools');
        expect(screen.getByText('QRコード生成')).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();
    });
});
