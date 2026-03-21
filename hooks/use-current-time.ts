import { useEffect, useState } from 'react';

export function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());

        const intervalId = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    return currentTime;
}
