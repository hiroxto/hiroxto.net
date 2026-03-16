'use client';

import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { ControlButtons } from '@/components/fare-ticket-route-planner/control-buttons';
import { Note } from '@/components/fare-ticket-route-planner/note';
import { Output } from '@/components/fare-ticket-route-planner/output';
import { RouteEditor } from '@/components/fare-ticket-route-planner/route';
import { Setting } from '@/components/fare-ticket-route-planner/setting';

export function FareTicketRoutePlannerPage() {
    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: '乗車券の経路作成' }]}
            title="乗車券の経路作成"
            description="複雑な経路の乗車券作る際の補助ツール"
            pageSize="xl"
        >
            <div className="grid grid-cols-12 xl:gap-4">
                <div className="col-span-12 xl:col-span-8">
                    <Setting />
                    <RouteEditor />
                    <Note />
                    <Output />
                </div>
                <div className="col-span-12 xl:col-span-4">
                    <ControlButtons />
                </div>
            </div>
        </SiteSubpageFrame>
    );
}
