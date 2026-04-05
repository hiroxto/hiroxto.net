import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithMantine } from '@/test/test-utils';
import * as clSoundPageModule from './cl-sound-page';

describe('ClSoundPage', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Play Success Tone ボタン押下で playSuccessTone を呼ぶこと', async () => {
        const user = userEvent.setup();
        const playSuccessToneSpy = vi
            .spyOn(clSoundPageModule.clSoundActions, 'playSuccessTone')
            .mockImplementation(() => {});
        const playAlertToneSpy = vi
            .spyOn(clSoundPageModule.clSoundActions, 'playAlertTone')
            .mockImplementation(() => {});
        renderWithMantine(<clSoundPageModule.ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Success Tone' }));

        expect(playSuccessToneSpy).toHaveBeenCalledTimes(1);
        expect(playAlertToneSpy).not.toHaveBeenCalled();
    });

    it('Play Alert Tone ボタン押下で playAlertTone を呼ぶこと', async () => {
        const user = userEvent.setup();
        const playSuccessToneSpy = vi
            .spyOn(clSoundPageModule.clSoundActions, 'playSuccessTone')
            .mockImplementation(() => {});
        const playAlertToneSpy = vi
            .spyOn(clSoundPageModule.clSoundActions, 'playAlertTone')
            .mockImplementation(() => {});
        renderWithMantine(<clSoundPageModule.ClSoundPage />);

        await user.click(screen.getByRole('button', { name: 'Play Alert Tone' }));

        expect(playAlertToneSpy).toHaveBeenCalledTimes(1);
        expect(playSuccessToneSpy).not.toHaveBeenCalled();
    });
});
