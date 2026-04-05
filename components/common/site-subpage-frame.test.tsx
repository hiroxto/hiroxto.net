import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { SiteSubpageFrame } from './site-subpage-frame';

describe('SiteSubpageFrame', () => {
    it('トップページのパンくずを自動付与して子要素を表示すること', () => {
        renderWithMantine(
            <SiteSubpageFrame
                items={[{ label: 'ツール一覧', href: '/tools' }, { label: 'QRコード生成' }]}
                title="QRコード生成"
                description="QRコードを生成します"
            >
                <div>body</div>
            </SiteSubpageFrame>,
        );

        expect(screen.getByRole('link', { name: 'トップページ' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'ツール一覧' })).toHaveAttribute('href', '/tools');
        expect(screen.getByText('body')).toBeInTheDocument();
    });
});
