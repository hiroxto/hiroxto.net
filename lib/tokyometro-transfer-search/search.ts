import {
    CROSS_STATION_TRANSFERS,
    LINE_DEFINITIONS,
    LINE_PATHS,
    type LineId,
    SAME_STATION_OUTSIDE_TRANSFERS,
    STATION_NAMES,
    type StationId,
    type TransferType,
} from './data';

type RideEdge = {
    kind: 'ride';
    stationId: StationId;
    lineId: LineId;
    distanceTenths: number;
};

type CrossTransferEdge = {
    kind: 'transfer';
    stationId: StationId;
    fromLineId: LineId;
    toLineId: LineId;
    type: TransferType;
};

type GraphEdge = RideEdge | CrossTransferEdge;

type LineRideEdge = {
    stationId: StationId;
    distanceTenths: number;
};

type RideStep = {
    kind: 'ride';
    fromStationId: StationId;
    toStationId: StationId;
    lineId: LineId;
    distanceTenths: number;
};

type TransferStep = {
    kind: 'transfer';
    fromStationId: StationId;
    toStationId: StationId;
    fromLineId: LineId;
    toLineId: LineId;
    type: TransferType;
};

type TraversalStep = RideStep | TransferStep;

export type RouteLeg = {
    fromStationId: StationId;
    toStationId: StationId;
    lineId: LineId;
    distanceTenths: number;
};

export type RouteTransfer = Omit<TransferStep, 'kind'>;

export type Fare = {
    ic: number;
    ticket: number;
};

export type FareCheckpoint = {
    stationId: StationId;
    shortestDistanceTenths: number;
    fare: Fare;
};

export type RouteResult = {
    key: string;
    legs: RouteLeg[];
    transfers: RouteTransfer[];
    outsideTransferCount: number;
    insideTransferCount: number;
    actualDistanceTenths: number;
    shortestDistanceTenths: number;
    fare: Fare;
    fareCheckpoints: FareCheckpoint[];
};

export type StationOption = {
    id: StationId;
    name: string;
    lineIds: LineId[];
};

const stationIds = Object.keys(STATION_NAMES) as StationId[];

const graph = new Map<StationId, GraphEdge[]>(stationIds.map((stationId) => [stationId, []]));
const stationLineIds = new Map<StationId, Set<LineId>>(stationIds.map((stationId) => [stationId, new Set<LineId>()]));
const lineGraphs = new Map<LineId, Map<StationId, LineRideEdge[]>>();

for (const path of LINE_PATHS) {
    let lineGraph = lineGraphs.get(path.lineId);

    if (lineGraph == null) {
        lineGraph = new Map<StationId, LineRideEdge[]>();
        lineGraphs.set(path.lineId, lineGraph);
    }

    for (const [stationId] of path.stations) {
        stationLineIds.get(stationId)?.add(path.lineId);

        if (!lineGraph.has(stationId)) {
            lineGraph.set(stationId, []);
        }
    }

    for (let index = 1; index < path.stations.length; index += 1) {
        const [fromStationId] = path.stations[index - 1];
        const [toStationId, distanceTenths] = path.stations[index];

        graph.get(fromStationId)?.push({
            kind: 'ride',
            stationId: toStationId,
            lineId: path.lineId,
            distanceTenths,
        });
        graph.get(toStationId)?.push({
            kind: 'ride',
            stationId: fromStationId,
            lineId: path.lineId,
            distanceTenths,
        });
        lineGraph.get(fromStationId)?.push({ stationId: toStationId, distanceTenths });
        lineGraph.get(toStationId)?.push({ stationId: fromStationId, distanceTenths });
    }
}

for (const connection of CROSS_STATION_TRANSFERS) {
    for (const [fromLineId, toLineId] of connection.linePairs) {
        graph.get(connection.fromStationId)?.push({
            kind: 'transfer',
            stationId: connection.toStationId,
            fromLineId,
            toLineId,
            type: connection.type,
        });
        graph.get(connection.toStationId)?.push({
            kind: 'transfer',
            stationId: connection.fromStationId,
            fromLineId: toLineId,
            toLineId: fromLineId,
            type: connection.type,
        });
    }
}

const outsideTransferKeys = new Set(
    SAME_STATION_OUTSIDE_TRANSFERS.map(([stationId, firstLineId, secondLineId]) =>
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
    ),
);

const getSameStationTransferType = (stationId: StationId, fromLineId: LineId, toLineId: LineId): TransferType =>
    outsideTransferKeys.has([stationId, ...[fromLineId, toLineId].sort()].join(':')) ? 'outside' : 'inside';

const stationBits = new Map(stationIds.map((stationId, index) => [stationId, BigInt(1) << BigInt(index)]));

const getStationBit = (stationId: StationId): bigint => {
    const bit = stationBits.get(stationId);

    if (bit == null) {
        throw new Error(`駅のビット値が見つかりません: ${stationId}`);
    }

    return bit;
};

type OutsideOpportunity = {
    stationIds: readonly StationId[];
};

const outsideOpportunities: OutsideOpportunity[] = [];
const sameStationOutsideOpportunityIds = new Map<StationId, number>();
const sameStationOutsideOpportunityBits = new Map<string, number>();

for (const [stationId, firstLineId, secondLineId] of SAME_STATION_OUTSIDE_TRANSFERS) {
    let opportunityId = sameStationOutsideOpportunityIds.get(stationId);

    if (opportunityId == null) {
        opportunityId = outsideOpportunities.length;
        outsideOpportunities.push({ stationIds: [stationId] });
        sameStationOutsideOpportunityIds.set(stationId, opportunityId);
    }

    sameStationOutsideOpportunityBits.set(
        [stationId, ...[firstLineId, secondLineId].sort()].join(':'),
        1 << opportunityId,
    );
}

const crossOutsideOpportunityBits = new Map<number, number>();

for (const [connectionIndex, connection] of CROSS_STATION_TRANSFERS.entries()) {
    if (connection.type !== 'outside') {
        continue;
    }

    const opportunityId = outsideOpportunities.length;
    outsideOpportunities.push({ stationIds: [connection.fromStationId, connection.toStationId] });
    crossOutsideOpportunityBits.set(connectionIndex, 1 << opportunityId);
}

if (outsideOpportunities.length > 30) {
    throw new Error('改札外乗換地点がビットマスクの上限を超えています');
}

const allOutsideOpportunityMask = (1 << outsideOpportunities.length) - 1;
const outsideOpportunityMaskByStation = new Map<StationId, number>(stationIds.map((stationId) => [stationId, 0]));

for (const [opportunityId, opportunity] of outsideOpportunities.entries()) {
    for (const stationId of opportunity.stationIds) {
        outsideOpportunityMaskByStation.set(
            stationId,
            (outsideOpportunityMaskByStation.get(stationId) ?? 0) | (1 << opportunityId),
        );
    }
}

const transferStationIds = new Set<StationId>([
    ...[...stationLineIds].filter(([, lineIds]) => lineIds.size > 1).map(([stationId]) => stationId),
    ...CROSS_STATION_TRANSFERS.flatMap(({ fromStationId, toStationId }) => [fromStationId, toStationId]),
]);

const physicalStationGraph = new Map<StationId, Set<StationId>>(
    stationIds.map((stationId) => [stationId, new Set<StationId>()]),
);

for (const [stationId, edges] of graph) {
    for (const edge of edges) {
        physicalStationGraph.get(stationId)?.add(edge.stationId);
    }
}

const getReachableStations = (startStationId: StationId, excludedStationId: StationId): Set<StationId> => {
    const reachableStations = new Set<StationId>();
    const unsettledStations = [startStationId];

    while (unsettledStations.length > 0) {
        const stationId = unsettledStations.pop();

        if (stationId == null || stationId === excludedStationId || reachableStations.has(stationId)) {
            continue;
        }

        reachableStations.add(stationId);

        for (const nextStationId of physicalStationGraph.get(stationId) ?? []) {
            unsettledStations.push(nextStationId);
        }
    }

    return reachableStations;
};

const getOutsideOpportunityMaskBetweenEndpoints = (
    originStationId: StationId,
    destinationStationId: StationId,
): number => {
    const reachableFromOrigin = getReachableStations(originStationId, destinationStationId);
    const reachableFromDestination = getReachableStations(destinationStationId, originStationId);
    let mask = 0;

    for (const [opportunityId, opportunity] of outsideOpportunities.entries()) {
        if (
            opportunity.stationIds.every(
                (stationId) => reachableFromOrigin.has(stationId) && reachableFromDestination.has(stationId),
            )
        ) {
            mask |= 1 << opportunityId;
        }
    }

    return mask;
};

export const stations: StationOption[] = stationIds.map((id) => ({
    id,
    name: STATION_NAMES[id],
    lineIds: [...(stationLineIds.get(id) ?? [])],
}));

export const isStationId = (value: string): value is StationId => value in STATION_NAMES;

const shortestDistanceCache = new Map<StationId, Map<StationId, number>>();

const getShortestDistances = (originStationId: StationId): Map<StationId, number> => {
    const cached = shortestDistanceCache.get(originStationId);

    if (cached != null) {
        return cached;
    }

    const distances = new Map<StationId, number>(stationIds.map((stationId) => [stationId, Number.POSITIVE_INFINITY]));
    const unsettled = new Set(stationIds);
    distances.set(originStationId, 0);

    while (unsettled.size > 0) {
        let currentStationId: StationId | null = null;
        let currentDistance = Number.POSITIVE_INFINITY;

        for (const stationId of unsettled) {
            const distance = distances.get(stationId) ?? Number.POSITIVE_INFINITY;

            if (distance < currentDistance) {
                currentStationId = stationId;
                currentDistance = distance;
            }
        }

        if (currentStationId == null) {
            break;
        }

        unsettled.delete(currentStationId);

        for (const edge of graph.get(currentStationId) ?? []) {
            const nextDistance = currentDistance + (edge.kind === 'ride' ? edge.distanceTenths : 0);

            if (nextDistance < (distances.get(edge.stationId) ?? Number.POSITIVE_INFINITY)) {
                distances.set(edge.stationId, nextDistance);
            }
        }
    }

    shortestDistanceCache.set(originStationId, distances);
    return distances;
};

const getRegularFare = (distanceTenths: number): Fare => {
    const roundedKilometers = Math.max(1, Math.ceil(distanceTenths / 10));

    if (roundedKilometers <= 6) {
        return { ic: 178, ticket: 180 };
    }

    if (roundedKilometers <= 11) {
        return { ic: 209, ticket: 210 };
    }

    if (roundedKilometers <= 19) {
        return { ic: 252, ticket: 260 };
    }

    if (roundedKilometers <= 27) {
        return { ic: 293, ticket: 300 };
    }

    return { ic: 324, ticket: 330 };
};

const isSamePair = (first: StationId, second: StationId, pair: readonly [StationId, StationId]): boolean =>
    (first === pair[0] && second === pair[1]) || (first === pair[1] && second === pair[0]);

const getFare = (originStationId: StationId, destinationStationId: StationId, distanceTenths: number): Fare => {
    if (isSamePair(originStationId, destinationStationId, ['ayase', 'kita-senju'])) {
        return { ic: 146, ticket: 150 };
    }

    const sharedNambokuSection = new Set<StationId>(['meguro', 'shirokanedai', 'shirokane-takanawa']);

    if (sharedNambokuSection.has(originStationId) && sharedNambokuSection.has(destinationStationId)) {
        return { ic: 178, ticket: 180 };
    }

    return getRegularFare(distanceTenths);
};

export const calculateFareBetweenStations = (
    originStationId: StationId,
    destinationStationId: StationId,
): Fare & { shortestDistanceTenths: number } => {
    const shortestDistanceTenths = getShortestDistances(originStationId).get(destinationStationId);

    if (shortestDistanceTenths == null || !Number.isFinite(shortestDistanceTenths)) {
        throw new Error('駅間の経路を構成できません');
    }

    return {
        ...getFare(originStationId, destinationStationId, shortestDistanceTenths),
        shortestDistanceTenths,
    };
};

const buildLegs = (originStationId: StationId, steps: TraversalStep[]): RouteLeg[] => {
    const legs: RouteLeg[] = [];
    let currentLeg: RouteLeg | null = null;
    let currentStationId = originStationId;

    for (const step of steps) {
        if (step.kind === 'transfer') {
            if (currentLeg != null) {
                legs.push(currentLeg);
                currentLeg = null;
            }

            currentStationId = step.toStationId;
            continue;
        }

        if (currentLeg == null) {
            currentLeg = {
                fromStationId: currentStationId,
                toStationId: step.toStationId,
                lineId: step.lineId,
                distanceTenths: step.distanceTenths,
            };
        } else {
            currentLeg.toStationId = step.toStationId;
            currentLeg.distanceTenths += step.distanceTenths;
        }

        currentStationId = step.toStationId;
    }

    if (currentLeg != null) {
        legs.push(currentLeg);
    }

    return legs;
};

const buildRouteResult = (
    originStationId: StationId,
    destinationStationId: StationId,
    steps: TraversalStep[],
    shortestDistances: Map<StationId, number>,
    actualDistanceTenths: number,
): RouteResult | null => {
    const transfers = steps
        .filter((step): step is TransferStep => step.kind === 'transfer')
        .map(({ kind: _kind, ...transfer }) => transfer);
    const outsideTransfers = transfers.filter((transfer) => transfer.type === 'outside');

    if (outsideTransfers.length === 0) {
        return null;
    }

    const shortestDistanceTenths = shortestDistances.get(destinationStationId) ?? Number.POSITIVE_INFINITY;
    const baseFare = getFare(originStationId, destinationStationId, shortestDistanceTenths);
    const fareCheckpoints = outsideTransfers.map((transfer) => {
        const checkpointDistance = shortestDistances.get(transfer.fromStationId) ?? Number.POSITIVE_INFINITY;

        return {
            stationId: transfer.fromStationId,
            shortestDistanceTenths: checkpointDistance,
            fare: getFare(originStationId, transfer.fromStationId, checkpointDistance),
        };
    });
    const fare = fareCheckpoints.reduce(
        (highestFare, checkpoint) => ({
            ic: Math.max(highestFare.ic, checkpoint.fare.ic),
            ticket: Math.max(highestFare.ticket, checkpoint.fare.ticket),
        }),
        baseFare,
    );

    return {
        key: steps
            .map((step) =>
                step.kind === 'ride'
                    ? `${step.lineId}:${step.fromStationId}>${step.toStationId}`
                    : `${step.type}:${step.fromLineId}>${step.toLineId}:${step.fromStationId}>${step.toStationId}`,
            )
            .join('|'),
        legs: buildLegs(originStationId, steps),
        transfers,
        outsideTransferCount: outsideTransfers.length,
        insideTransferCount: transfers.length - outsideTransfers.length,
        actualDistanceTenths,
        shortestDistanceTenths,
        fare,
        fareCheckpoints,
    };
};

type MacroSegment = {
    fromStationId: StationId;
    toStationId: StationId;
    lineId: LineId;
    rideSteps: RideStep[];
    stationMask: bigint;
    outsideOpportunityMask: number;
    distanceTenths: number;
};

type MacroTransfer = {
    step: TransferStep;
    outsideOpportunityBit: number;
};

const macroTransferCache = new Map<string, MacroTransfer[]>();

const getMacroTransfers = (stationId: StationId, fromLineId: LineId): MacroTransfer[] => {
    const cacheKey = `${stationId}:${fromLineId}`;
    const cached = macroTransferCache.get(cacheKey);

    if (cached != null) {
        return cached;
    }

    const transfers: MacroTransfer[] = [];

    for (const toLineId of stationLineIds.get(stationId) ?? []) {
        if (toLineId === fromLineId) {
            continue;
        }

        const transferType = getSameStationTransferType(stationId, fromLineId, toLineId);
        transfers.push({
            step: {
                kind: 'transfer',
                fromStationId: stationId,
                toStationId: stationId,
                fromLineId,
                toLineId,
                type: transferType,
            },
            outsideOpportunityBit:
                transferType === 'outside'
                    ? (sameStationOutsideOpportunityBits.get([stationId, ...[fromLineId, toLineId].sort()].join(':')) ??
                      0)
                    : 0,
        });
    }

    for (const [connectionIndex, connection] of CROSS_STATION_TRANSFERS.entries()) {
        const isForward = connection.fromStationId === stationId;
        const isBackward = connection.toStationId === stationId;

        if (!isForward && !isBackward) {
            continue;
        }

        for (const [firstLineId, secondLineId] of connection.linePairs) {
            const expectedFromLineId = isForward ? firstLineId : secondLineId;

            if (expectedFromLineId !== fromLineId) {
                continue;
            }

            transfers.push({
                step: {
                    kind: 'transfer',
                    fromStationId: stationId,
                    toStationId: isForward ? connection.toStationId : connection.fromStationId,
                    fromLineId,
                    toLineId: isForward ? secondLineId : firstLineId,
                    type: connection.type,
                },
                outsideOpportunityBit: crossOutsideOpportunityBits.get(connectionIndex) ?? 0,
            });
        }
    }

    transfers.sort(
        (first, second) =>
            Number(second.step.type === 'outside') - Number(first.step.type === 'outside') ||
            first.step.toLineId.localeCompare(second.step.toLineId) ||
            first.step.toStationId.localeCompare(second.step.toStationId),
    );
    macroTransferCache.set(cacheKey, transfers);
    return transfers;
};

const macroSegmentCache = new Map<string, MacroSegment[]>();

const getMacroSegments = (
    fromStationId: StationId,
    lineId: LineId,
    destinationStationId: StationId,
): MacroSegment[] => {
    const cacheKey = `${fromStationId}:${lineId}:${destinationStationId}`;
    const cached = macroSegmentCache.get(cacheKey);

    if (cached != null) {
        return cached;
    }

    const lineGraph = lineGraphs.get(lineId);

    if (lineGraph == null) {
        return [];
    }

    const segments: MacroSegment[] = [];
    const visitedStations = new Set<StationId>([fromStationId]);
    const rideSteps: RideStep[] = [];

    const visit = (
        stationId: StationId,
        stationMask: bigint,
        outsideOpportunityMask: number,
        distanceTenths: number,
    ): void => {
        if (stationId !== fromStationId && (stationId === destinationStationId || transferStationIds.has(stationId))) {
            segments.push({
                fromStationId,
                toStationId: stationId,
                lineId,
                rideSteps: [...rideSteps],
                stationMask,
                outsideOpportunityMask,
                distanceTenths,
            });
        }

        if (stationId === destinationStationId) {
            return;
        }

        for (const edge of lineGraph.get(stationId) ?? []) {
            if (visitedStations.has(edge.stationId)) {
                continue;
            }

            const rideStep: RideStep = {
                kind: 'ride',
                fromStationId: stationId,
                toStationId: edge.stationId,
                lineId,
                distanceTenths: edge.distanceTenths,
            };
            visitedStations.add(edge.stationId);
            rideSteps.push(rideStep);
            visit(
                edge.stationId,
                stationMask | getStationBit(edge.stationId),
                outsideOpportunityMask | (outsideOpportunityMaskByStation.get(edge.stationId) ?? 0),
                distanceTenths + edge.distanceTenths,
            );
            rideSteps.pop();
            visitedStations.delete(edge.stationId);
        }
    };

    visit(fromStationId, BigInt(0), 0, 0);
    macroSegmentCache.set(cacheKey, segments);
    return segments;
};

const compareRoutes = (first: RouteResult, second: RouteResult): number =>
    second.outsideTransferCount - first.outsideTransferCount ||
    first.insideTransferCount - second.insideTransferCount ||
    first.actualDistanceTenths - second.actualDistanceTenths ||
    first.key.localeCompare(second.key);

const countBits = (value: number): number => {
    let remaining = value;
    let count = 0;

    while (remaining !== 0) {
        remaining &= remaining - 1;
        count += 1;
    }

    return count;
};

export const SEARCH_RESULT_LIMIT = 20;
export const MAX_OUTSIDE_TRANSFER_COUNT = 14;

export const isValidMaximumOutsideTransferCount = (value: number): boolean =>
    Number.isInteger(value) && value >= 1 && value <= MAX_OUTSIDE_TRANSFER_COUNT;

export const searchRoutes = (
    originStationId: StationId,
    destinationStationId: StationId,
    maximumOutsideTransferCount: number | null = null,
): RouteResult[] => {
    if (maximumOutsideTransferCount != null && !isValidMaximumOutsideTransferCount(maximumOutsideTransferCount)) {
        throw new Error(`最大改札外乗換回数は1〜${MAX_OUTSIDE_TRANSFER_COUNT}回で指定してください`);
    }

    if (originStationId === destinationStationId) {
        return [];
    }

    const shortestDistances = getShortestDistances(originStationId);
    const unavailableOutsideMask =
        (outsideOpportunityMaskByStation.get(originStationId) ?? 0) |
        (outsideOpportunityMaskByStation.get(destinationStationId) ?? 0);
    const availableOutsideMask =
        allOutsideOpportunityMask &
        getOutsideOpportunityMaskBetweenEndpoints(originStationId, destinationStationId) &
        ~unavailableOutsideMask;
    const availableOutsideCount = countBits(availableOutsideMask);
    const maximumOutsideCount = Math.min(availableOutsideCount, maximumOutsideTransferCount ?? availableOutsideCount);

    for (let targetOutsideCount = maximumOutsideCount; targetOutsideCount >= 1; targetOutsideCount -= 1) {
        const results: RouteResult[] = [];

        const addResult = (result: RouteResult): void => {
            results.push(result);
            results.sort(compareRoutes);

            if (results.length > SEARCH_RESULT_LIMIT) {
                results.pop();
            }
        };

        for (
            let requiredOutsideMask = availableOutsideMask;
            requiredOutsideMask > 0;
            requiredOutsideMask = (requiredOutsideMask - 1) & availableOutsideMask
        ) {
            if (countBits(requiredOutsideMask) !== targetOutsideCount) {
                continue;
            }

            const segmentStack: MacroSegment[] = [];
            const transferStack: MacroTransfer[] = [];

            const visit = (
                stationId: StationId,
                lineId: LineId,
                visitedStationMask: bigint,
                usedOutsideMask: number,
                insideTransferCount: number,
                actualDistanceTenths: number,
            ): void => {
                const worstResult = results.length === SEARCH_RESULT_LIMIT ? results.at(-1) : null;

                if (worstResult != null) {
                    const shortestRemainingDistance =
                        getShortestDistances(stationId).get(destinationStationId) ?? Number.POSITIVE_INFINITY;

                    if (
                        insideTransferCount > worstResult.insideTransferCount ||
                        (insideTransferCount === worstResult.insideTransferCount &&
                            actualDistanceTenths + shortestRemainingDistance > worstResult.actualDistanceTenths)
                    ) {
                        return;
                    }
                }

                const remainingRequiredMask = requiredOutsideMask & ~usedOutsideMask;
                const segments = getMacroSegments(stationId, lineId, destinationStationId)
                    .filter((segment) => (visitedStationMask & segment.stationMask) === BigInt(0))
                    .sort(
                        (first, second) =>
                            Number((second.outsideOpportunityMask & remainingRequiredMask) !== 0) -
                                Number((first.outsideOpportunityMask & remainingRequiredMask) !== 0) ||
                            first.distanceTenths - second.distanceTenths ||
                            first.toStationId.localeCompare(second.toStationId),
                    );

                for (const segment of segments) {
                    const touchedRequiredMask = segment.outsideOpportunityMask & requiredOutsideMask & ~usedOutsideMask;

                    if (countBits(touchedRequiredMask) > 1) {
                        continue;
                    }

                    const nextVisitedStationMask = visitedStationMask | segment.stationMask;
                    const nextDistanceTenths = actualDistanceTenths + segment.distanceTenths;
                    segmentStack.push(segment);

                    if (segment.toStationId === destinationStationId) {
                        if (touchedRequiredMask === 0 && usedOutsideMask === requiredOutsideMask) {
                            const steps: TraversalStep[] = [];

                            for (const [segmentIndex, routeSegment] of segmentStack.entries()) {
                                steps.push(...routeSegment.rideSteps);

                                const transfer = transferStack[segmentIndex];

                                if (transfer != null) {
                                    steps.push(transfer.step);
                                }
                            }

                            const result = buildRouteResult(
                                originStationId,
                                destinationStationId,
                                steps,
                                shortestDistances,
                                nextDistanceTenths,
                            );

                            if (result != null) {
                                addResult(result);
                            }
                        }

                        segmentStack.pop();
                        continue;
                    }

                    for (const transfer of getMacroTransfers(segment.toStationId, lineId)) {
                        const isOutside = transfer.step.type === 'outside';

                        if (
                            (isOutside &&
                                ((requiredOutsideMask & transfer.outsideOpportunityBit) === 0 ||
                                    (usedOutsideMask & transfer.outsideOpportunityBit) !== 0 ||
                                    touchedRequiredMask !== transfer.outsideOpportunityBit)) ||
                            (!isOutside && touchedRequiredMask !== 0)
                        ) {
                            continue;
                        }

                        const changesStation = transfer.step.toStationId !== transfer.step.fromStationId;

                        if (
                            changesStation &&
                            (nextVisitedStationMask & getStationBit(transfer.step.toStationId)) !== BigInt(0)
                        ) {
                            continue;
                        }

                        const afterTransferVisitedMask =
                            nextVisitedStationMask | getStationBit(transfer.step.toStationId);
                        transferStack.push(transfer);
                        visit(
                            transfer.step.toStationId,
                            transfer.step.toLineId,
                            afterTransferVisitedMask,
                            usedOutsideMask | transfer.outsideOpportunityBit,
                            insideTransferCount + Number(!isOutside),
                            nextDistanceTenths,
                        );
                        transferStack.pop();
                    }

                    segmentStack.pop();
                }
            };

            for (const lineId of stationLineIds.get(originStationId) ?? []) {
                visit(originStationId, lineId, getStationBit(originStationId), 0, 0, 0);
            }
        }

        if (results.length > 0) {
            return results;
        }
    }

    return [];
};

export const formatDistance = (distanceTenths: number): string => `${(distanceTenths / 10).toFixed(1)}km`;

export const getLineLabel = (lineId: LineId): string => LINE_DEFINITIONS[lineId].name;
