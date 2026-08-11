import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { DtmfPage } from './dtmf-page';

class FakeAudioParam {
    value = 0;

    cancelScheduledValues() {}

    exponentialRampToValueAtTime(value: number) {
        this.value = value;
    }

    setValueAtTime(value: number) {
        this.value = value;
    }
}

class FakeGainNode {
    gain = new FakeAudioParam();

    connect() {}

    disconnect() {}
}

class FakeOscillator {
    frequency = new FakeAudioParam();
    stoppedAt: number | null = null;
    type: OscillatorType = 'sine';

    addEventListener() {}

    connect() {}

    disconnect() {}

    start() {}

    stop(when?: number) {
        this.stoppedAt = when ?? 0;
    }
}

class FakeAudioContext {
    static latest: FakeAudioContext | null = null;

    currentTime = 10;
    destination = {};
    oscillators: FakeOscillator[] = [];
    state: AudioContextState = 'running';

    constructor() {
        FakeAudioContext.latest = this;
    }

    close() {
        this.state = 'closed';
        return Promise.resolve();
    }

    createGain() {
        return new FakeGainNode();
    }

    createOscillator() {
        const oscillator = new FakeOscillator();
        this.oscillators.push(oscillator);
        return oscillator;
    }

    resume() {
        this.state = 'running';
        return Promise.resolve();
    }
}

const renderPage = () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    return renderWithMantine(<DtmfPage />);
};

describe('DtmfPage', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        FakeAudioContext.latest = null;
    });

    it('5のボタンを押している間は770 Hzと1336 Hzの信号音を再生すること', () => {
        renderPage();
        const button = screen.getByRole('button', { name: '5、770 Hzと1336 Hz' });
        button.setPointerCapture = vi.fn();

        fireEvent.pointerDown(button, { button: 0, pointerId: 1, pointerType: 'mouse' });

        expect(screen.getByText('5 (770 Hz + 1336 Hz)')).toBeInTheDocument();
        expect(FakeAudioContext.latest?.oscillators).toMatchObject([
            { frequency: { value: 770 }, stoppedAt: null, type: 'sine' },
            { frequency: { value: 1336 }, stoppedAt: null, type: 'sine' },
        ]);

        fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse' });

        expect(screen.getByText('停止中')).toBeInTheDocument();
        expect(FakeAudioContext.latest?.oscillators).toMatchObject([
            { stoppedAt: expect.any(Number) },
            { stoppedAt: expect.any(Number) },
        ]);
    });

    it('物理キーボードの#を押している間は941 Hzと1477 Hzの信号音を再生すること', () => {
        renderPage();

        fireEvent.keyDown(window, { code: 'Digit3', key: '#', shiftKey: true });

        expect(screen.getByText('# (941 Hz + 1477 Hz)')).toBeInTheDocument();
        expect(FakeAudioContext.latest?.oscillators).toMatchObject([
            { frequency: { value: 941 }, stoppedAt: null },
            { frequency: { value: 1477 }, stoppedAt: null },
        ]);

        fireEvent.keyUp(window, { code: 'Digit3', key: '#', shiftKey: true });

        expect(screen.getByText('停止中')).toBeInTheDocument();
    });

    it.each([
        ['Ctrl', { ctrlKey: true }],
        ['Meta', { metaKey: true }],
        ['Alt', { altKey: true }],
    ])('%sキーとのショートカットではAの信号音を再生しないこと', (_, modifier) => {
        renderPage();

        const wasNotCancelled = fireEvent.keyDown(window, { code: 'KeyA', key: 'a', ...modifier });

        expect(wasNotCancelled).toBe(true);
        expect(screen.getByText('停止中')).toBeInTheDocument();
        expect(FakeAudioContext.latest).toBeNull();
    });

    it('合成clickでは信号音を一定時間だけ再生すること', () => {
        vi.useFakeTimers();
        renderPage();
        const button = screen.getByRole('button', { name: '1、697 Hzと1209 Hz' });

        fireEvent.click(button, { detail: 0 });

        expect(screen.getByText('1 (697 Hz + 1209 Hz)')).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(150));

        expect(screen.getByText('停止中')).toBeInTheDocument();
    });

    it('通常のポインターclickでは停止した信号音を再開しないこと', () => {
        renderPage();
        const button = screen.getByRole('button', { name: '1、697 Hzと1209 Hz' });
        button.setPointerCapture = vi.fn();

        fireEvent.pointerDown(button, { button: 0, pointerId: 1, pointerType: 'mouse' });
        fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse' });
        fireEvent.click(button, { detail: 1 });

        expect(screen.getByText('停止中')).toBeInTheDocument();
        expect(FakeAudioContext.latest?.oscillators).toHaveLength(2);
    });
});
