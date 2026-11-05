import styles from '@/components/fare-ticket-route-planner/fare-ticket-route-planner.module.css';
import { SoundButton } from '@/components/fare-ticket-route-planner/sound-button';

interface MobileActionsProps {
    onAddRoute: () => void;
    onSave: () => void;
}

// 狭い画面では経路追加と保存を下部に固定し、同じ高さの余白で末尾までスクロールできるようにする。
export function MobileActions({ onAddRoute, onSave }: MobileActionsProps) {
    return (
        <div className={styles.mobileActionsSpace}>
            <fieldset aria-label="経路の固定操作" className={styles.mobileActions}>
                <SoundButton color="gray" soundType="click" onClick={onAddRoute} className={styles.mobileActionButton}>
                    経路追加
                </SoundButton>
                <SoundButton color="blue" soundType="click" onClick={onSave} className={styles.mobileActionButton}>
                    保存・更新
                </SoundButton>
            </fieldset>
        </div>
    );
}
