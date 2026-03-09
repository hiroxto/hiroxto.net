'use client';

import { useEffect, useRef } from 'react';

export type SoundType = 'click' | 'chime' | 'success';

const SOUND_PATHS: Record<SoundType, string> = {
    click: '/assets/tools/fare-ticket-route-planner/sounds/maou_se_system40.mp3',
    chime: '/assets/tools/fare-ticket-route-planner/sounds/maou_se_chime13.mp3',
    success: '/assets/tools/fare-ticket-route-planner/sounds/maou_se_system49.mp3',
};

const audioCache = new Map<SoundType, HTMLAudioElement>();

if (typeof window !== 'undefined') {
    for (const [type, path] of Object.entries(SOUND_PATHS)) {
        const audio = new Audio(path);
        audio.load();
        audioCache.set(type as SoundType, audio);
    }
}

export const useSound = (soundType: SoundType) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioCache.get(soundType);
        if (audio != null) {
            audioRef.current = audio;
        }
    }, [soundType]);

    return () => {
        if (audioRef.current == null) {
            return;
        }

        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch((error: unknown) => {
            console.error('Failed to play sound:', error);
        });
    };
};
