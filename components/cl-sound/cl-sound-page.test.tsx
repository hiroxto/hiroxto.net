import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { ClSoundPage } from './cl-sound-page';

class FakeOscillator {
    type: OscillatorType | null = null;
    frequency = { value: 0 };
    connectedDestination: unknown = null;
    startedAt: number | null = null;
    stoppedAt: number | null = null;

    connect(destination: unknown) {
        this.connectedDestination = destination;
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

    it('Play Success Tone ボタン押下で成功音を再生すること', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expect(FakeAudioContext.latest?.oscillators).toMatchObject([
            {
                type: 'sine',
                frequency: { value: 1500 },
                startedAt: 10,
                stoppedAt: 10.5,
            },
        ]);
    });

    it('Play Alert Tone ボタン押下で警告音を再生すること', async () => {
        const user = userEvent.setup();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        expect(FakeAudioContext.latest?.oscillators).toMatchObject([
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
});
