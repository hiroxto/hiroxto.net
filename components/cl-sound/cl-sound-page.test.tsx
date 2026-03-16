import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { ClSoundPage } from './cl-sound-page';

describe('ClSoundPage', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const createOscillator = vi.fn(() => ({
        type: 'sine',
        frequency: { value: 0 },
        connect,
        start,
        stop,
    }));
    const AudioContextMock = vi.fn(
        class {
            currentTime = 10;
            destination = {};
            createOscillator = createOscillator;
        },
    );

    beforeEach(() => {
        start.mockReset();
        stop.mockReset();
        connect.mockReset();
        createOscillator.mockClear();
        AudioContextMock.mockClear();

        Object.defineProperty(window, 'AudioContext', {
            writable: true,
            value: AudioContextMock,
        });
    });

    it('success tone は 1 回だけ発音すること', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expect(window.AudioContext).toHaveBeenCalledTimes(1);
        expect(createOscillator).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(10);
        expect(stop).toHaveBeenCalledWith(10.5);
    });

    it('alert tone はダブルビープを鳴らすこと', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        expect(createOscillator).toHaveBeenCalledTimes(2);
        expect(start).toHaveBeenNthCalledWith(1, 10);
        expect(stop).toHaveBeenNthCalledWith(1, 10.2);
        expect(start).toHaveBeenNthCalledWith(2, 10.4);
        expect(stop).toHaveBeenNthCalledWith(2, 10.6);
    });
});
