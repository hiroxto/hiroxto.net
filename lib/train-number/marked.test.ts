import { describe, expect, it } from 'vitest';
import { renderTrainNumberMarkdown } from './marked';

describe('renderTrainNumberMarkdown', () => {
    it('markdown を HTML に変換し見出し ID を付与すること', () => {
        const html = renderTrainNumberMarkdown(`# 2018年3月17日 改正

- [入出場](#入出場)
- [その他 (旅客機)](#その他-旅客機)

## 入出場

\`東大宮操~回8610M~大宮\`

### その他 (旅客機)
`);

        expect(html).toContain('<h1 id="2018年3月17日-改正">2018年3月17日 改正</h1>');
        expect(html).toContain('<h2 id="入出場">入出場</h2>');
        expect(html).toContain('<h3 id="その他-旅客機">その他 (旅客機)</h3>');
        expect(html).toContain('<code>東大宮操~回8610M~大宮</code>');
    });
});
