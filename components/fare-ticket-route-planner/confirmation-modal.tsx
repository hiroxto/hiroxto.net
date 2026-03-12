'use client';

import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';

interface ConfirmationModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
}

export function ConfirmationModal({
    opened,
    onClose,
    onConfirm,
    title,
    message,
    confirmButtonText = '削除',
    cancelButtonText = 'キャンセル',
    confirmButtonColor = 'red',
}: ConfirmationModalProps) {
    return (
        <Modal opened={opened} onClose={onClose} title={title}>
            <p>{message}</p>
            <div className="mt-4 flex justify-end gap-2">
                <SoundButton variant="light" onClick={onClose} soundType="click">
                    {cancelButtonText}
                </SoundButton>
                <SoundButton variant="filled" color={confirmButtonColor} onClick={onConfirm} soundType="click">
                    {confirmButtonText}
                </SoundButton>
            </div>
        </Modal>
    );
}

export function useConfirmationModal() {
    const [isOpened, { open, close }] = useDisclosure(false);
    const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

    const openModal = (onConfirm: () => void) => {
        setOnConfirmCallback(() => onConfirm);
        open();
    };

    const handleConfirm = () => {
        onConfirmCallback?.();
        close();
    };

    return {
        isOpened,
        openModal,
        closeModal: close,
        handleConfirm,
    };
}
