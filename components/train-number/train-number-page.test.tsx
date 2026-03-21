import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { TrainNumberPage } from './train-number-page';

describe('TrainNumberPage', () => {
    it('markdown を HTML として表示し見出しIDも付与すること', () => {
        const { container } = renderWithMantine(
            <TrainNumberPage
                title="2018年3月17日 改正"
                markdownSource={`# 2018年3月17日 改正

- [入出場](#入出場)
- [その他 (旅客機)](#その他-旅客機)

## 入出場

\`東大宮操~回8610M~大宮\`

### その他 (旅客機)
`}
            />,
        );

        expect(screen.getAllByRole('heading', { name: '2018年3月17日 改正' })).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'ツール一覧' })).toHaveAttribute('href', '/tools');
        expect(screen.getByRole('link', { name: '列車番号メモ' })).toHaveAttribute('href', '/tools/train-number');
        expect(screen.getByRole('link', { name: '入出場' })).toHaveAttribute('href', '#%E5%85%A5%E5%87%BA%E5%A0%B4');
        expect(screen.getByText('東大宮操~回8610M~大宮')).toBeInTheDocument();
        expect(container.querySelector('#入出場')).not.toBeNull();
        expect(container.querySelector('#その他-旅客機')).not.toBeNull();
    });
});
