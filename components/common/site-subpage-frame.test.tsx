import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { SiteSubpageFrame } from './site-subpage-frame';

describe('SiteSubpageFrame', () => {
    it('トップページのパンくずを自動付与して子要素を表示すること', () => {
        renderWithMantine(
            <SiteSubpageFrame
                items={[{ label: 'Tools', href: '/tools' }, { label: 'QRコード生成' }]}
                title="QRコード生成"
                description="QRコードを生成します"
            >
                <div>body</div>
            </SiteSubpageFrame>,
        );

        expect(screen.getByRole('link', { name: 'Top page' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'Tools' })).toHaveAttribute('href', '/tools');
        expect(screen.getByText('body')).toBeInTheDocument();
    });

    it('定義済みキーと独自の階層を指定すると順序を保ってリンクと現在地を表示すること', () => {
        renderWithMantine(
            <SiteSubpageFrame
                items={[
                    'tools',
                    { label: '乗車券の経路作成', href: '/tools/fare-ticket-route-planner' },
                    { label: '保存済み経路' },
                ]}
                title="保存済み経路"
                description="保存した経路の一覧と操作"
            >
                <div>body</div>
            </SiteSubpageFrame>,
        );

        expect(screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
            ['Top page', '/'],
            ['Tools', '/tools'],
            ['乗車券の経路作成', '/tools/fare-ticket-route-planner'],
        ]);
        expect(screen.queryByRole('link', { name: '保存済み経路' })).not.toBeInTheDocument();
        expect(screen.getByText('保存済み経路', { selector: 'header p' })).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();
    });

    it('パンくず項目が空の場合はトップページへのリンクだけを表示すること', () => {
        renderWithMantine(
            <SiteSubpageFrame items={[]} title="ページ" description="説明">
                <div>body</div>
            </SiteSubpageFrame>,
        );

        expect(screen.getAllByRole('link')).toHaveLength(1);
        expect(screen.getByRole('link', { name: 'Top page' })).toHaveAttribute('href', '/');
        expect(screen.getByText('body')).toBeInTheDocument();
    });
});
