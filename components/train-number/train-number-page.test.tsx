import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { TrainNumberPage } from './train-number-page';

describe('TrainNumberPage', () => {
    it('markdown を HTML として表示すること', () => {
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

        expect(screen.getByRole('link', { name: 'ツール一覧' })).toHaveAttribute('href', '/tools');
        expect(screen.getByRole('link', { name: '列車番号メモ' })).toHaveAttribute('href', '/tools/train-number');
        expect(screen.getByText('東大宮操~回8610M~大宮')).toBeInTheDocument();
        expect(container.querySelector('article')).not.toBeNull();
    });
});
