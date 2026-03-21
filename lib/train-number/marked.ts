import { Marked, type Tokens } from 'marked';

const slugCounts = new Map<string, number>();

const createHeadingId = (value: string): string => {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[()[\]{}]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const count = slugCounts.get(normalized) ?? 0;
    slugCounts.set(normalized, count + 1);

    if (count === 0) {
        return normalized;
    }

    return `${normalized}-${count}`;
};

export const renderTrainNumberMarkdown = (source: string): string => {
    slugCounts.clear();

    const marked = new Marked({
        gfm: true,
    });

    marked.use({
        renderer: {
            heading({ tokens, depth }: Tokens.Heading): string {
                const text = this.parser.parseInline(tokens);
                const id = createHeadingId(text);

                return `<h${depth} id="${id}">${text}</h${depth}>`;
            },
        },
    });

    return marked.parse(source) as string;
};
