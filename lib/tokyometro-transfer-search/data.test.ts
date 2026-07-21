import { describe, expect, it } from 'vitest';
import { LINE_PATHS, type LineId, type StationId } from './data';

type ExpectedLinePath = {
    lineId: LineId;
    stations: ReadonlyArray<readonly [StationId, number]>;
};

// 東京メトロ旅客営業規程（2026年6月14日施行）別表第1号表から転記した値。
// 本番データの誤りを共有しないよう、期待値はテスト内へ固定する。
const expectedLinePaths = [
    {
        lineId: 'ginza',
        stations: [
            ['shibuya', 0],
            ['omote-sando', 12],
            ['gaiemmae', 7],
            ['aoyama-itchome', 7],
            ['akasaka-mitsuke', 13],
            ['tameike-sanno', 7],
            ['toranomon', 8],
            ['shimbashi', 8],
            ['ginza', 9],
            ['kyobashi', 7],
            ['nihombashi', 7],
            ['mitsukoshimae', 6],
            ['kanda', 7],
            ['suehirocho', 11],
            ['ueno-hirokoji', 6],
            ['ueno', 5],
            ['inaricho', 7],
            ['tawaramachi', 7],
            ['asakusa', 8],
        ],
    },
    {
        lineId: 'marunouchi',
        stations: [
            ['ogikubo', 0],
            ['minami-asagaya', 15],
            ['shin-koenji', 12],
            ['higashi-koenji', 9],
            ['shin-nakano', 10],
            ['nakano-sakaue', 11],
            ['nishi-shinjuku', 11],
            ['shinjuku', 8],
            ['shinjuku-sanchome', 3],
            ['shinjuku-gyoemmae', 7],
            ['yotsuya-sanchome', 9],
            ['yotsuya', 10],
            ['akasaka-mitsuke', 13],
            ['kokkai-gijidomae', 9],
            ['kasumigaseki', 7],
            ['ginza', 10],
            ['tokyo', 11],
            ['otemachi', 6],
            ['awajicho', 9],
            ['ochanomizu', 8],
            ['hongo-sanchome', 8],
            ['korakuen', 8],
            ['myogadani', 18],
            ['shin-otsuka', 12],
            ['ikebukuro', 18],
        ],
    },
    {
        lineId: 'marunouchi',
        stations: [
            ['honancho', 0],
            ['nakano-fujimicho', 13],
            ['nakano-shimbashi', 6],
            ['nakano-sakaue', 13],
        ],
    },
    {
        lineId: 'hibiya',
        stations: [
            ['naka-meguro', 0],
            ['ebisu', 10],
            ['hiro-o', 15],
            ['roppongi', 17],
            ['kamiyacho', 15],
            ['toranomon-hills', 5],
            ['kasumigaseki', 8],
            ['hibiya', 12],
            ['ginza', 4],
            ['higashi-ginza', 4],
            ['tsukiji', 6],
            ['hatchobori', 10],
            ['kayabacho', 5],
            ['ningyocho', 9],
            ['kodemmacho', 6],
            ['akihabara', 9],
            ['naka-okachimachi', 10],
            ['ueno', 5],
            ['iriya', 12],
            ['minowa', 12],
            ['minami-senju', 8],
            ['kita-senju', 21],
        ],
    },
    {
        lineId: 'tozai',
        stations: [
            ['nakano', 0],
            ['ochiai', 20],
            ['takadanobaba', 19],
            ['waseda', 17],
            ['kagurazaka', 12],
            ['iidabashi', 12],
            ['kudanshita', 7],
            ['takebashi', 10],
            ['otemachi', 10],
            ['nihombashi', 8],
            ['kayabacho', 5],
            ['monzen-nakacho', 18],
            ['kiba', 11],
            ['toyocho', 9],
            ['minami-sunamachi', 12],
            ['nishi-kasai', 27],
            ['kasai', 12],
            ['urayasu', 19],
            ['minami-gyotoku', 12],
            ['gyotoku', 15],
            ['myoden', 13],
            ['baraki-nakayama', 21],
            ['nishi-funabashi', 19],
        ],
    },
    {
        lineId: 'chiyoda',
        stations: [
            ['yoyogi-uehara', 0],
            ['yoyogi-koen', 10],
            ['meiji-jingumae', 12],
            ['omote-sando', 9],
            ['nogizaka', 14],
            ['akasaka', 11],
            ['kokkai-gijidomae', 8],
            ['kasumigaseki', 8],
            ['hibiya', 8],
            ['nijubashimae', 7],
            ['otemachi', 7],
            ['shin-ochanomizu', 13],
            ['yushima', 12],
            ['nezu', 12],
            ['sendagi', 10],
            ['nishi-nippori', 9],
            ['machiya', 17],
            ['kita-senju', 26],
            ['ayase', 26],
            ['kita-ayase', 21],
        ],
    },
    {
        lineId: 'yurakucho',
        stations: [
            ['wakoshi', 0],
            ['chikatetsu-narimasu', 22],
            ['chikatetsu-akatsuka', 14],
            ['heiwadai', 18],
            ['hikawadai', 14],
            ['kotake-mukaihara', 15],
            ['senkawa', 10],
            ['kanamecho', 10],
            ['ikebukuro', 12],
            ['higashi-ikebukuro', 9],
            ['gokokuji', 11],
            ['edogawabashi', 13],
            ['iidabashi', 16],
            ['ichigaya', 11],
            ['kojimachi', 9],
            ['nagatacho', 9],
            ['sakuradamon', 9],
            ['yurakucho', 10],
            ['ginza-itchome', 5],
            ['shintomicho', 7],
            ['tsukishima', 13],
            ['toyosu', 14],
            ['tatsumi', 17],
            ['shin-kiba', 15],
        ],
    },
    {
        lineId: 'hanzomon',
        stations: [
            ['shibuya', 0],
            ['omote-sando', 13],
            ['aoyama-itchome', 14],
            ['nagatacho', 14],
            ['hanzomon', 10],
            ['kudanshita', 16],
            ['jimbocho', 4],
            ['otemachi', 17],
            ['mitsukoshimae', 7],
            ['suitengumae', 13],
            ['kiyosumi-shirakawa', 17],
            ['sumiyoshi', 19],
            ['kinshicho', 10],
            ['oshiage', 14],
        ],
    },
    {
        lineId: 'nanboku',
        stations: [
            ['meguro', 0],
            ['shirokanedai', 13],
            ['shirokane-takanawa', 10],
            ['azabu-juban', 13],
            ['roppongi-itchome', 12],
            ['tameike-sanno', 9],
            ['nagatacho', 7],
            ['yotsuya', 15],
            ['ichigaya', 10],
            ['iidabashi', 11],
            ['korakuen', 14],
            ['todaimae', 13],
            ['hon-komagome', 9],
            ['komagome', 14],
            ['nishigahara', 14],
            ['oji', 10],
            ['oji-kamiya', 12],
            ['shimo', 16],
            ['akabane-iwabuchi', 11],
        ],
    },
    {
        lineId: 'fukutoshin',
        stations: [
            ['wakoshi', 0],
            ['chikatetsu-narimasu', 22],
            ['chikatetsu-akatsuka', 14],
            ['heiwadai', 18],
            ['hikawadai', 14],
            ['kotake-mukaihara', 15],
            ['senkawa', 11],
            ['kanamecho', 10],
            ['ikebukuro', 9],
            ['zoshigaya', 18],
            ['nishi-waseda', 15],
            ['higashi-shinjuku', 9],
            ['shinjuku-sanchome', 11],
            ['kita-sando', 14],
            ['meiji-jingumae', 12],
            ['shibuya', 10],
        ],
    },
] as const satisfies ReadonlyArray<ExpectedLinePath>;

const findAdjacentDistance = (lineId: LineId, fromStationId: StationId, toStationId: StationId): number => {
    const path = LINE_PATHS.find(
        (linePath) =>
            linePath.lineId === lineId &&
            linePath.stations.some(
                ([stationId], index) =>
                    index > 0 && linePath.stations[index - 1][0] === fromStationId && stationId === toStationId,
            ),
    );
    const toStationIndex = path?.stations.findIndex(([stationId]) => stationId === toStationId) ?? -1;

    if (path == null || toStationIndex < 1 || path.stations[toStationIndex - 1][0] !== fromStationId) {
        throw new Error(`${lineId}:${fromStationId}―${toStationId}の隣接区間が見つかりません`);
    }

    return path.stations[toStationIndex][1];
};

describe('LINE_PATHS', () => {
    it('全路線の駅順と全隣接駅間営業キロが別表第1号表と一致する', () => {
        expect(LINE_PATHS).toEqual(expectedLinePaths);
    });

    it.each([
        ['ginza', 'shibuya', 'omote-sando', 12],
        ['ginza', 'akasaka-mitsuke', 'tameike-sanno', 7],
        ['ginza', 'tameike-sanno', 'toranomon', 8],
        ['hibiya', 'kamiyacho', 'toranomon-hills', 5],
        ['hibiya', 'toranomon-hills', 'kasumigaseki', 8],
        ['nanboku', 'tameike-sanno', 'nagatacho', 7],
        ['nanboku', 'nagatacho', 'yotsuya', 15],
    ] as const)(
        '%s線の%s―%sを単独で検証すると営業キロが正しい',
        (lineId, fromStationId, toStationId, expectedDistanceTenths) => {
            expect(findAdjacentDistance(lineId, fromStationId, toStationId)).toBe(expectedDistanceTenths);
        },
    );
});
