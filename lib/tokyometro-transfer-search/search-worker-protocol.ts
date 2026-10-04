import type { StationId } from './data';
import type { RouteSearchResult } from './search';

export type RouteSearchRequest = {
    originStationId: StationId;
    destinationStationId: StationId;
    maximumOutsideTransferCount: number | null;
};

export type RouteSearchResponse =
    | ({ status: 'success' } & RouteSearchResult)
    | {
          status: 'error';
          message: string;
      };
