using UnityEngine;

namespace BrainRepublic
{
    // 스테이지/국 테마 데이터 — 세계관(6개 국)을 3D 스테이지로 번안.
    // 모든 지오메트리는 이 데이터로부터 StageBuilder가 프로시저럴 생성한다.

    public enum ObKind { Spike, MovingBlock, SlowZone, WordGate }

    [System.Serializable]
    public struct Ob
    {
        public ObKind kind;
        public Vector3 pos;
        public Vector3 size;
        public Vector3 moveAxis; // MovingBlock 이동 축·진폭
        public float speed;

        public Ob(ObKind k, Vector3 p, Vector3 s, Vector3 axis = default, float sp = 1f)
        {
            kind = k; pos = p; size = s; moveAxis = axis; speed = sp;
        }
    }

    public class StageDef
    {
        public string id;
        public string title;
        public string keeper;      // 국장 이름 (인트로 대사 화자)
        public string intro;       // 스테이지 인트로 한 줄
        public Color theme;        // 국 고유색
        public Color fog;
        public float friction = 1f;    // 감정국(빙판) < 1
        public float fogDensity = 0.02f;
        public Vector3[] platforms;    // (x, z, 폭) — y는 경로 순서에 따라 자동 하강
        public Vector3[] crystals;     // 기억 조각 위치
        public Ob[] obstacles;
        public Vector3 gatePos;
        public int needCrystals;
        public float starTime2; // 이 시간 안에 클리어하면 별2
        public float starTime3; // 별3
    }

    public static class StageDefs
    {
        // 직선 진행형 코스: 플랫폼은 z+ 방향으로 이어진다.
        // 폭이 좁아지고 장애물이 늘어나는 난이도 곡선.
        public static readonly StageDef[] All =
        {
            new StageDef
            {
                id = "memory", title = "STAGE 1 · 서고 협곡", keeper = "나이테 국장",
                intro = "첫 자전거 탄 날의 기억 조각이 서고 협곡에 흩어졌네. 부탁하네!",
                theme = new Color(0.79f, 0.64f, 0.37f), fog = new Color(0.16f, 0.11f, 0.06f),
                platforms = new[]
                {
                    new Vector3(0, 0, 10), new Vector3(0, 12, 8), new Vector3(2, 24, 6),
                    new Vector3(-2, 36, 6), new Vector3(0, 48, 8)
                },
                crystals = new[]
                {
                    new Vector3(0, 6, 0), new Vector3(1.5f, 14, 0), new Vector3(2, 26, 0),
                    new Vector3(-2, 38, 0), new Vector3(0, 46, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(-1.5f, 15, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(0, 27, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(-3, 37, 0), new Vector3(1, 1, 1))
                },
                gatePos = new Vector3(0, 52, 0), needCrystals = 4, starTime2 = 45, starTime3 = 28
            },
            new StageDef
            {
                id = "body", title = "STAGE 2 · 맥박 브릿지", keeper = "덩쿨 국장",
                intro = "심박에 맞춰 다리가 움직인다네. 리듬을 타고 건너가게!",
                theme = new Color(0.91f, 0.42f, 0.37f), fog = new Color(0.14f, 0.05f, 0.05f),
                platforms = new[]
                {
                    new Vector3(0, 0, 8), new Vector3(0, 14, 4), new Vector3(0, 26, 4),
                    new Vector3(0, 38, 4), new Vector3(0, 50, 8)
                },
                crystals = new[]
                {
                    new Vector3(0, 7, 0), new Vector3(1, 15, 0), new Vector3(-1, 27, 0),
                    new Vector3(1, 39, 0), new Vector3(0, 48, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.MovingBlock, new Vector3(0, 18, 0), new Vector3(3f, 1.2f, 1.2f), new Vector3(2.6f, 0, 0), 1.6f),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 30, 0), new Vector3(3f, 1.2f, 1.2f), new Vector3(-2.6f, 0, 0), 2.0f),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 42, 0), new Vector3(3f, 1.2f, 1.2f), new Vector3(2.6f, 0, 0), 2.4f)
                },
                gatePos = new Vector3(0, 54, 0), needCrystals = 4, starTime2 = 50, starTime3 = 32
            },
            new StageDef
            {
                id = "emotion", title = "STAGE 3 · 눈물 웅덩이", keeper = "이슬 국장",
                intro = "바닥이 눈물로 미끄러워요. 마음을 다잡고 천천히… 아니, 빠르게요!",
                theme = new Color(0.33f, 0.76f, 0.71f), fog = new Color(0.04f, 0.12f, 0.12f),
                friction = 0.15f,
                platforms = new[]
                {
                    new Vector3(0, 0, 9), new Vector3(3, 13, 6), new Vector3(-3, 26, 6),
                    new Vector3(3, 39, 6), new Vector3(0, 52, 8)
                },
                crystals = new[]
                {
                    new Vector3(0, 6, 0), new Vector3(3, 15, 0), new Vector3(-3, 28, 0),
                    new Vector3(3, 41, 0), new Vector3(0, 50, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.SlowZone, new Vector3(3, 16, 0), new Vector3(4, 0.3f, 3)),
                    new Ob(ObKind.Spike, new Vector3(-2, 27, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.SlowZone, new Vector3(3, 42, 0), new Vector3(4, 0.3f, 3))
                },
                gatePos = new Vector3(0, 56, 0), needCrystals = 4, starTime2 = 55, starTime3 = 36
            },
            new StageDef
            {
                id = "impulse", title = "STAGE 4 · 네온 함정밭", keeper = "반짝 국장",
                intro = "유혹의 네온이 번쩍인다! 빨간 불빛은 절대 밟지 마!",
                theme = new Color(0.69f, 0.41f, 0.91f), fog = new Color(0.10f, 0.04f, 0.15f),
                platforms = new[]
                {
                    new Vector3(0, 0, 8), new Vector3(0, 12, 7), new Vector3(0, 24, 7),
                    new Vector3(0, 36, 7), new Vector3(0, 48, 8)
                },
                crystals = new[]
                {
                    new Vector3(-2, 8, 0), new Vector3(2, 14, 0), new Vector3(-2, 26, 0),
                    new Vector3(2, 38, 0), new Vector3(0, 46, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(0, 13, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(-2, 15, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(2, 25, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(0, 27, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 39, 0), new Vector3(2.4f, 1.2f, 1.2f), new Vector3(2.8f, 0, 0), 2.6f)
                },
                gatePos = new Vector3(0, 52, 0), needCrystals = 5, starTime2 = 55, starTime3 = 36
            },
            new StageDef
            {
                id = "speech", title = "STAGE 5 · 단어의 관문", keeper = "안테나 국장",
                intro = "갈림길마다 단어 게이트가 있다. 올바른 표현의 문으로만 지나가게!",
                theme = new Color(0.94f, 0.77f, 0.25f), fog = new Color(0.14f, 0.11f, 0.03f),
                platforms = new[]
                {
                    new Vector3(0, 0, 8), new Vector3(0, 13, 8), new Vector3(0, 27, 8),
                    new Vector3(0, 41, 8)
                },
                crystals = new[]
                {
                    new Vector3(0, 7, 0), new Vector3(-2, 15, 0), new Vector3(2, 29, 0),
                    new Vector3(0, 39, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.WordGate, new Vector3(0, 20, 0), new Vector3(0, 0, 0), default, 0),
                    new Ob(ObKind.WordGate, new Vector3(0, 34, 1), new Vector3(0, 0, 0), default, 1)
                },
                gatePos = new Vector3(0, 45, 0), needCrystals = 3, starTime2 = 50, starTime3 = 34
            },
            new StageDef
            {
                id = "dream", title = "STAGE 6 · 안개의 끝", keeper = "몽글 국장",
                intro = "마지막 조각은 안개 너머에 있어요. 반딧불이가 길을 알려줄 거예요.",
                theme = new Color(0.44f, 0.49f, 0.91f), fog = new Color(0.06f, 0.07f, 0.16f),
                fogDensity = 0.08f,
                platforms = new[]
                {
                    new Vector3(0, 0, 8), new Vector3(2, 12, 5), new Vector3(-2, 24, 5),
                    new Vector3(2, 36, 5), new Vector3(-2, 48, 5), new Vector3(0, 60, 8)
                },
                crystals = new[]
                {
                    new Vector3(2, 14, 0), new Vector3(-2, 26, 0), new Vector3(2, 38, 0),
                    new Vector3(-2, 50, 0), new Vector3(0, 58, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(0, 13, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 30, 0), new Vector3(2.4f, 1.2f, 1.2f), new Vector3(2.4f, 0, 0), 2.2f),
                    new Ob(ObKind.Spike, new Vector3(0, 49, 0), new Vector3(1, 1, 1))
                },
                gatePos = new Vector3(0, 64, 0), needCrystals = 5, starTime2 = 65, starTime3 = 42
            }
        };

        // 언어 관문 문제 (correct, wrong)
        public static readonly string[][] WordPairs =
        {
            new[] { "하겠습니다", "할게염" },
            new[] { "좋은 질문입니다", "어…그게…" },
            new[] { "성실한 지원자", "부실한 지원자" },
            new[] { "도전적인 과제", "노답인 과제" }
        };
    }
}
