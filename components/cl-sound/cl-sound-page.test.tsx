import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import { ClSoundPage } from './cl-sound-page';

class FakeGain {
    gain = { value: 1 };
    connectedDestination: unknown = null;

    connect(destination: unknown) {
        this.connectedDestination = destination;
    }

    disconnect() {
        this.connectedDestination = null;
    }
}

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

    stop(when = 0) {
        this.stoppedAt = when;
    }
}

class FakeAudioContext {
    static instances: FakeAudioContext[] = [];
    static initialState: AudioContextState = 'running';
    static failResume = false;
    static failCreateOscillator = false;

    currentTime = 10;
    destination = {};
    oscillators: FakeOscillator[] = [];
    gain = new FakeGain();
    state: AudioContextState = FakeAudioContext.initialState;

    constructor() {
        FakeAudioContext.instances.push(this);
    }

    close() {
        this.state = 'closed';
        return Promise.resolve();
    }

    resume() {
        if (FakeAudioContext.failResume) {
            return Promise.reject(new Error('AudioContext resume failed'));
        }
        this.state = 'running';
        return Promise.resolve();
    }

    createGain() {
        return this.gain;
    }

    createOscillator() {
        if (FakeAudioContext.failCreateOscillator) {
            throw new Error('Oscillator creation failed');
        }
        const oscillator = new FakeOscillator();
        this.oscillators.push(oscillator);
        return oscillator;
    }
}

function latestContext() {
    const context = FakeAudioContext.instances.at(-1);
    if (context == null) {
        throw new Error('AudioContext was not created');
    }
    return context;
}

function endTone(context: FakeAudioContext, index: number) {
    act(() => context.oscillators[index].dispatchEvent(new Event('ended')));
}

function expectButtonsDisabled(disabled: boolean) {
    for (const name of ['Play Success Tone', 'Play Alert Tone']) {
        expect(screen.getByRole('button', { name })).toHaveProperty('disabled', disabled);
    }
}

describe('ClSoundPage', () => {
    beforeEach(() => {
        vi.stubGlobal('AudioContext', FakeAudioContext);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        FakeAudioContext.instances = [];
        FakeAudioContext.initialState = 'running';
        FakeAudioContext.failResume = false;
        FakeAudioContext.failCreateOscillator = false;
    });

    it('成功音を1500Hzで0.5秒再生し、終了後に再操作できる', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        const context = latestContext();
        expect(context.oscillators).toMatchObject([
            { type: 'sine', frequency: { value: 1500 }, startedAt: 10, stoppedAt: 10.5 },
        ]);
        expect(screen.getByRole('status')).toHaveTextContent('Success Tone 再生中');
        expectButtonsDisabled(true);

        endTone(context, 0);

        expect(screen.getByRole('status')).toHaveTextContent('停止中');
        expectButtonsDisabled(false);
        expect(context.state).toBe('closed');
        expect(context.gain.connectedDestination).toBeNull();
        expect(context.oscillators[0].connectedDestination).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));
        expect(FakeAudioContext.instances).toHaveLength(2);
    });

    it('警告音を750Hzで0.2秒ずつ再生し、0.2秒の無音区間も両ボタンを無効にする', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));
        const context = latestContext();
        expect(context.oscillators).toMatchObject([
            { type: 'sine', frequency: { value: 750 }, startedAt: 10, stoppedAt: 10.2 },
            { type: 'sine', frequency: { value: 750 }, startedAt: 10.4, stoppedAt: 10.6 },
        ]);
        expect(screen.getByRole('status')).toHaveTextContent('Alert Tone 再生中');
        expectButtonsDisabled(true);

        endTone(context, 0);
        expectButtonsDisabled(true);
        expect(screen.getByRole('status')).toHaveTextContent('Alert Tone 再生中');
        expect(context.state).toBe('running');

        endTone(context, 1);
        expectButtonsDisabled(false);
        expect(screen.getByRole('status')).toHaveTextContent('停止中');
        expect(context.state).toBe('closed');
    });

    it('同一イベント内で連打されても音声を二重に開始しない', () => {
        renderWithMantine(<ClSoundPage />);
        const success = screen.getByRole('button', { name: 'Play Success Tone' });
        const alert = screen.getByRole('button', { name: 'Play Alert Tone' });

        act(() => {
            success.click();
            success.click();
            alert.click();
        });

        expect(FakeAudioContext.instances).toHaveLength(1);
        expect(latestContext().oscillators).toHaveLength(1);
    });

    it.each([
        { key: 'Home', percent: 0, gain: 0 },
        { key: 'ArrowLeft', percent: 99, gain: 0.99 },
        { key: 'End', percent: 100, gain: 1 },
    ])('音量を$percent%にすると次の再生に適用する', async ({ key, percent, gain }) => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);
        fireEvent.keyDown(screen.getByRole('slider', { name: '音量' }), { key });
        expect(screen.getByRole('slider', { name: '音量' })).toHaveAttribute('aria-valuenow', String(percent));

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        const context = latestContext();
        expect(context.gain.gain.value).toBe(gain);
        expect(context.gain.connectedDestination).toBe(context.destination);
        expect(context.oscillators[0].connectedDestination).toBe(context.gain);
    });

    it('再生中に音量を変更すると再生中の音量も変わる', async () => {
        const user = userEvent.setup();
        renderWithMantine(<ClSoundPage />);
        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        fireEvent.keyDown(screen.getByRole('slider', { name: '音量' }), { key: 'Home' });

        expect(latestContext().gain.gain.value).toBe(0);
        expectButtonsDisabled(true);
    });

    it('再生中にアンマウントすると予定済みの音も停止してリソースを解放する', async () => {
        const user = userEvent.setup();
        const { unmount } = renderWithMantine(<ClSoundPage />);
        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));
        const context = latestContext();

        unmount();

        expect(context.state).toBe('closed');
        expect(context.gain.connectedDestination).toBeNull();
        for (const oscillator of context.oscillators) {
            expect(oscillator.stoppedAt).toBe(0);
            expect(oscillator.connectedDestination).toBeNull();
        }
    });

    it('AudioContextの生成に失敗した後も再操作できる', async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
            'AudioContext',
            class {
                constructor() {
                    throw new Error('AudioContext unavailable');
                }
            },
        );
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expectButtonsDisabled(false);
        expect(screen.getByRole('alert')).toHaveTextContent('再生できませんでした');
        vi.stubGlobal('AudioContext', FakeAudioContext);
        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Alert Tone 再生中');
    });

    it('音声の準備に失敗したらリソースを解放し再操作できる', async () => {
        const user = userEvent.setup();
        FakeAudioContext.failCreateOscillator = true;
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expectButtonsDisabled(false);
        expect(latestContext().state).toBe('closed');
        expect(latestContext().gain.connectedDestination).toBeNull();
        expect(screen.getByRole('alert')).toHaveTextContent('再生できませんでした');
    });

    it('中断中のAudioContextを再開し、失敗した場合は解放して再操作できる', async () => {
        const user = userEvent.setup();
        FakeAudioContext.initialState = 'suspended';
        FakeAudioContext.failResume = true;
        renderWithMantine(<ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        expectButtonsDisabled(false);
        expect(latestContext().state).toBe('closed');
        expect(screen.getByRole('alert')).toHaveTextContent('再生できませんでした');
        FakeAudioContext.failResume = false;
        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));
        expect(latestContext().state).toBe('running');
        expectButtonsDisabled(true);
    });
});
