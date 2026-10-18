import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { ClSoundPage } from './cl-sound-page';

class FakeOscillator extends EventTarget {
    type: OscillatorType | null = null;
    frequency = { value: 0 };
    connectedDestination: unknown = null;
    startedAt: number | null = null;
    stoppedAt: number | null = null;

    connect(destination: unknown) {
        this.connectedDestination = destination;
    }

    disconnect() {
        this.connectedDestination = null;
    }

    start(when?: number) {
        this.startedAt = when ?? null;
    }

    stop(when?: number) {
        this.stoppedAt = when ?? null;
    }
}

class FakeAudioContext {
    static latest: FakeAudioContext | null = null;

    currentTime = 10;
    destination = {};
    oscillators: FakeOscillator[] = [];

    constructor() {
        FakeAudioContext.latest = this;
    }

    close = vi.fn().mockResolvedValue(undefined);

    createOscillator() {
        const oscillator = new FakeOscillator();
        this.oscillators.push(oscillator);
        return oscillator;
    }
}

describe('ClSoundPage', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        FakeAudioContext.latest = null;
    });

    it('Play Success Tone ボタンを押すと成功音を再生する', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expect(
            FakeAudioContext.latest?.oscillators.toSorted((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0)),
        ).toMatchObject([
            {
                type: 'sine',
                frequency: { value: 1500 },
                startedAt: 10,
                stoppedAt: 10.5,
            },
        ]);
    });

    it('Play Alert Tone ボタンを押すと警告音を再生する', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        expect(
            FakeAudioContext.latest?.oscillators.toSorted((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0)),
        ).toMatchObject([
            {
                type: 'sine',
                frequency: { value: 750 },
                startedAt: 10,
                stoppedAt: 10.2,
            },
            {
                type: 'sine',
                frequency: { value: 750 },
                startedAt: 10.4,
                stoppedAt: 10.6,
            },
        ]);
    });
    it('成功音の終了後に、その再生のAudioContextを閉じる', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));
        const context = FakeAudioContext.latest;
        expect(context?.close).not.toHaveBeenCalled();
        context?.oscillators[0].dispatchEvent(new Event('ended'));
        expect(context?.close).toHaveBeenCalledTimes(1);
    });

    it('警告音は両方の音が終了するまで閉じず、再生ごとのAudioContextを閉じる', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        const button = screen.getByRole('button', { name: 'Play Alert Tone' });
        await user.click(button);
        const firstContext = FakeAudioContext.latest;
        await user.click(button);
        const secondContext = FakeAudioContext.latest;
        expect(secondContext).not.toBe(firstContext);

        firstContext?.oscillators[0].dispatchEvent(new Event('ended'));
        expect(firstContext?.close).not.toHaveBeenCalled();
        firstContext?.oscillators[1].dispatchEvent(new Event('ended'));
        expect(firstContext?.close).toHaveBeenCalledTimes(1);
        expect(secondContext?.close).not.toHaveBeenCalled();

        secondContext?.oscillators[0].dispatchEvent(new Event('ended'));
        secondContext?.oscillators[1].dispatchEvent(new Event('ended'));
        expect(secondContext?.close).toHaveBeenCalledTimes(1);
    });
});
