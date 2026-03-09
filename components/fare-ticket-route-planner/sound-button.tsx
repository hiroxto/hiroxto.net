'use client';

import { Button, type ButtonProps } from '@mantine/core';
import { type SoundType, useSound } from '@/components/fare-ticket-route-planner/use-sound';

interface SoundButtonProps extends ButtonProps {
    soundType: SoundType;
    onClick: () => void;
}

export function SoundButton({ soundType, onClick, ...props }: SoundButtonProps) {
    const playSound = useSound(soundType);

    const handleClick = () => {
        playSound();
        onClick();
    };

    return <Button {...props} onClick={handleClick} />;
}
