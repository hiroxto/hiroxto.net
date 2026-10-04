import { searchRoutes } from './search';
import type { RouteSearchRequest, RouteSearchResponse } from './search-worker-protocol';

const workerScope = globalThis as unknown as {
    onmessage: ((event: MessageEvent<RouteSearchRequest>) => void) | null;
    postMessage: (message: RouteSearchResponse) => void;
};

workerScope.onmessage = ({ data }: MessageEvent<RouteSearchRequest>) => {
    try {
        const result = searchRoutes(data.originStationId, data.destinationStationId, data.maximumOutsideTransferCount);
        workerScope.postMessage({
            status: 'success',
            ...result,
        });
    } catch (error) {
        workerScope.postMessage({
            status: 'error',
            message: error instanceof Error ? error.message : '経路検索に失敗しました',
        });
    }
};
