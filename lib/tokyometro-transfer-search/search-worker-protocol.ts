import type { StationId } from './data';
import type { RouteResult } from './search';

export type RouteSearchRequest = {
    originStationId: StationId;
    destinationStationId: StationId;
    maximumOutsideTransferCount: number | null;
};

export type RouteSearchResponse =
    | {
          status: 'success';
          routes: RouteResult[];
      }
    | {
          status: 'error';
          message: string;
      };
