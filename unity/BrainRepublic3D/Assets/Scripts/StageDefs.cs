using UnityEngine;

namespace BrainRepublic
{
    // ---- 세계관: 홀로그램 기억 코어 원정 ----
    // 시험 전야, 뇌 관제실의 기억 코어가 과부하로 산산조각 나 여섯 국으로 흩어졌다.
    // 신입 요원 '스파크'가 코어 파편을 회수한다. 각 국을 구할 때마다
    // 국장이 능력을 하나 빌려준다 — 스테이지 = 에피소드, 클리어 = 스킬 획득.

    public enum Skill { Jump = 0, Dash = 1, Shield = 2, Focus = 3, Magnet = 4, None = 99 }

    public enum ObKind { Spike, MovingBlock, SlowZone, WordGate }

    [System.Serializable]
    public struct Ob
    {
        public ObKind kind;
        public Vector3 pos;
        public Vector3 size;
        public Vector3 moveAxis;
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
        public string keeper;
        public string story;       // 에피소드 서사 (연속 스토리)
        public string intro;       // 국장 대사
        public Skill grants;       // 클리어 시 획득 스킬
        public string skillName;
        public string skillDesc;
        public Color theme;
        public Color fog;
        public float friction = 1f;
        public float fogDensity = 0.015f;
        // (x = 좌우, y = 코스 z 위치, z = 폭). 연속성 규칙:
        // 인접 세그먼트의 걸을 수 있는 겹침 폭 ≥ 2.5 유지, 틈새는 스킬로만 돌파.
        public Vector3[] platforms;
        public Vector3[] crystals;
        public Ob[] obstacles;
        public Vector3 gatePos;
        public int needCrystals;
        public float starTime2;
        public float starTime3;
    }

    public static class StageDefs
    {
        public static readonly StageDef[] All =
        {
            new StageDef
            {
                id = "memory", title = "EP1 · 서고, 첫 파편", keeper = "나이테 국장",
                story = "23:40 — 기억 코어가 터졌다. 첫 파편의 신호는 기억인지국의 오래된 서고에서 잡혔다.",
                intro = "자네가 새 요원인가. 서고 깊은 곳의 파편을 부탁하네. 천천히, 하지만 자정 전에!",
                grants = Skill.Jump, skillName = "도약",
                skillDesc = "나이테 국장의 선물 — 버튼(스페이스)으로 점프한다.",
                theme = new Color(0.98f, 0.75f, 0.35f), fog = new Color(0.05f, 0.04f, 0.10f),
                platforms = new[]
                {
                    new Vector3(0, 0, 10), new Vector3(0, 13, 9), new Vector3(2, 26, 8),
                    new Vector3(0, 39, 8), new Vector3(0, 52, 9)
                },
                crystals = new[]
                {
                    new Vector3(0, 7, 0), new Vector3(1.5f, 20, 0), new Vector3(2, 30, 0),
                    new Vector3(-1, 42, 0), new Vector3(0, 50, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(-2, 27, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(1.5f, 40, 0), new Vector3(1, 1, 1))
                },
                gatePos = new Vector3(0, 56, 0), needCrystals = 4, starTime2 = 45, starTime3 = 28
            },
            new StageDef
            {
                id = "body", title = "EP2 · 끊어진 맥박 다리", keeper = "덩쿨 국장",
                story = "코어 폭발의 여파로 신체반응국의 다리가 곳곳이 끊겼다. 두 번째 파편이 다리 건너에서 깜빡인다.",
                intro = "다리가 끊겨서 말이야. 나이테 국장의 「도약」을 받았다지? 틈은 뛰어넘게!",
                grants = Skill.Dash, skillName = "질주",
                skillDesc = "덩쿨 국장의 선물 — 버튼(Shift)으로 앞으로 폭발적으로 가속한다.",
                theme = new Color(1f, 0.45f, 0.5f), fog = new Color(0.08f, 0.03f, 0.08f),
                platforms = new[]
                {
                    // 간격 17 = 3유닛 틈새 → 「도약」 필요
                    new Vector3(0, 0, 9), new Vector3(0, 17, 6), new Vector3(0, 34, 6),
                    new Vector3(0, 51, 6), new Vector3(0, 66, 9)
                },
                crystals = new[]
                {
                    new Vector3(0, 7, 0), new Vector3(1, 20, 0), new Vector3(-1, 37, 0),
                    new Vector3(1, 54, 0), new Vector3(0, 64, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.MovingBlock, new Vector3(0, 37, 0), new Vector3(2.6f, 1.2f, 1.2f), new Vector3(2.2f, 0, 0), 1.7f),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 54, 0), new Vector3(2.6f, 1.2f, 1.2f), new Vector3(-2.2f, 0, 0), 2.1f)
                },
                gatePos = new Vector3(0, 70, 0), needCrystals = 4, starTime2 = 55, starTime3 = 35
            },
            new StageDef
            {
                id = "emotion", title = "EP3 · 눈물의 수면 위", keeper = "이슬 국장",
                story = "세 번째 파편은 감정사회국의 눈물 웅덩이에 가라앉았다. 코어를 잃은 슬픔에 바닥이 온통 얼어붙었다.",
                intro = "미끄러워도 괜찮아요. 「질주」로 단숨에 건너면 돼요. 파편이 웅덩이 끝에서 빛나고 있어요.",
                grants = Skill.Shield, skillName = "수막 방패",
                skillDesc = "이슬 국장의 선물 — 위험을 한 번 막아주는 물의 장막 (자동 발동, 8초 충전).",
                theme = new Color(0.35f, 0.9f, 0.95f), fog = new Color(0.02f, 0.08f, 0.10f),
                friction = 0.2f,
                platforms = new[]
                {
                    // 공정성 재설계: 어긋남 ±2 이하, 폭 7~9 → 겹침 폭 3+ 확보
                    new Vector3(0, 0, 9), new Vector3(2, 13, 7), new Vector3(0, 26, 7),
                    new Vector3(-2, 39, 7), new Vector3(0, 55, 8)  // 39→55 = 2유닛 틈 (도약)
                },
                crystals = new[]
                {
                    new Vector3(0, 6, 0), new Vector3(2, 16, 0), new Vector3(0, 29, 0),
                    new Vector3(-2, 42, 0), new Vector3(0, 53, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.SlowZone, new Vector3(2, 17, 0), new Vector3(4, 0.3f, 3)),
                    new Ob(ObKind.Spike, new Vector3(0, 27.5f, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.SlowZone, new Vector3(-2, 43, 0), new Vector3(4, 0.3f, 3))
                },
                gatePos = new Vector3(0, 59, 0), needCrystals = 4, starTime2 = 55, starTime3 = 36
            },
            new StageDef
            {
                id = "impulse", title = "EP4 · 붉은 유혹의 밭", keeper = "반짝 국장",
                story = "자정. 네 번째 파편을 삼킨 충동관리국 번화가에 붉은 유혹 등이 무더기로 돋아났다.",
                intro = "빨간 불빛은 전부 함정이야! 이슬 국장의 「수막 방패」가 있다면… 한 번쯤은 실수해도 돼.",
                grants = Skill.Focus, skillName = "시간 제동",
                skillDesc = "반짝 국장의 선물 — 버튼(F)으로 잠시 세상을 느리게 본다 (10초 충전).",
                theme = new Color(0.8f, 0.45f, 1f), fog = new Color(0.07f, 0.02f, 0.12f),
                platforms = new[]
                {
                    new Vector3(0, 0, 9), new Vector3(0, 13, 7), new Vector3(-2, 26, 7),
                    new Vector3(0, 39, 7), new Vector3(0, 52, 8)
                },
                crystals = new[]
                {
                    new Vector3(-2, 8, 0), new Vector3(2, 15, 0), new Vector3(-2, 29, 0),
                    new Vector3(2, 41, 0), new Vector3(0, 50, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(0, 14, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(-1.5f, 16.5f, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(-2, 27.5f, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.Spike, new Vector3(-0.5f, 30, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 42, 0), new Vector3(2.4f, 1.2f, 1.2f), new Vector3(2.4f, 0, 0), 2.4f)
                },
                gatePos = new Vector3(0, 56, 0), needCrystals = 5, starTime2 = 60, starTime3 = 38
            },
            new StageDef
            {
                id = "speech", title = "EP5 · 진심의 관문", keeper = "안테나 국장",
                story = "다섯 번째 파편은 언어표현국 안테나탑 꼭대기에. 하지만 탑은 「진심의 관문」으로 봉인되어 있다.",
                intro = "관문은 거짓 표현에 닫히고 진심에 열린다네. 헷갈리면 「시간 제동」으로 천천히 읽게!",
                grants = Skill.Magnet, skillName = "기억 자석",
                skillDesc = "안테나 국장의 선물 — 버튼(Q)으로 근처의 파편을 끌어당긴다 (10초 충전).",
                theme = new Color(1f, 0.9f, 0.3f), fog = new Color(0.09f, 0.07f, 0.02f),
                platforms = new[]
                {
                    new Vector3(0, 0, 9), new Vector3(0, 13, 8), new Vector3(0, 28, 8),
                    new Vector3(0, 43, 8)
                },
                crystals = new[]
                {
                    new Vector3(0, 7, 0), new Vector3(-2.5f, 16, 0), new Vector3(2.5f, 31, 0),
                    new Vector3(0, 41, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.WordGate, new Vector3(0, 20.5f, 0), new Vector3(0, 0, 0), default, 0),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 31, 0), new Vector3(2.4f, 1.2f, 1.2f), new Vector3(2.6f, 0, 0), 2.8f),
                    new Ob(ObKind.WordGate, new Vector3(0, 36, 1), new Vector3(0, 0, 0), default, 1)
                },
                gatePos = new Vector3(0, 47, 0), needCrystals = 3, starTime2 = 50, starTime3 = 34
            },
            new StageDef
            {
                id = "dream", title = "EP6 · 안개 너머, 코어의 심장", keeper = "몽글 국장",
                story = "01:59. 마지막 파편이자 코어의 심장이 수면상상국 안개 깊은 곳에서 뛰고 있다. 모두의 능력을 모아 원정을 끝낼 시간.",
                intro = "안개 속에서 파편이 숨바꼭질을 해요. 「기억 자석」으로 불러 모으세요. …주인의 아침을 위해!",
                grants = Skill.None, skillName = "",
                skillDesc = "",
                theme = new Color(0.55f, 0.6f, 1f), fog = new Color(0.03f, 0.04f, 0.12f),
                fogDensity = 0.07f,
                platforms = new[]
                {
                    new Vector3(0, 0, 9), new Vector3(2, 13, 7), new Vector3(0, 26, 6),
                    new Vector3(-2, 39, 7), new Vector3(0, 55, 6), new Vector3(0, 68, 9) // 39→55 틈새
                },
                crystals = new[]
                {
                    new Vector3(2, 16, 0), new Vector3(0, 29, 0), new Vector3(-2, 42, 0),
                    new Vector3(0, 57, 0), new Vector3(0, 66, 0)
                },
                obstacles = new[]
                {
                    new Ob(ObKind.Spike, new Vector3(1, 14, 0), new Vector3(1, 1, 1)),
                    new Ob(ObKind.MovingBlock, new Vector3(0, 30, 0), new Vector3(2.2f, 1.2f, 1.2f), new Vector3(2.0f, 0, 0), 2.2f),
                    new Ob(ObKind.Spike, new Vector3(-1, 41, 0), new Vector3(1, 1, 1))
                },
                gatePos = new Vector3(0, 72, 0), needCrystals = 5, starTime2 = 70, starTime3 = 45
            }
        };

        public static readonly string[][] WordPairs =
        {
            new[] { "하겠습니다", "할게염" },
            new[] { "좋은 질문입니다", "어…그게…" },
            new[] { "성실한 지원자", "부실한 지원자" },
            new[] { "도전적인 과제", "노답인 과제" }
        };

        public static readonly string EndingStory =
            "02:00 — 여섯 조각이 하나로 맞물리자, 관제실의 홀로그램 코어가 다시 은은하게 빛나기 시작했다.\n" +
            "여섯 국장의 능력과 신입 요원 스파크의 밤샘 원정 덕분에,\n주인은 아침에 그 어느 때보다 맑은 머리로 눈을 떴다.\n\n" +
            "…뇌 관제실의 하루는, 내일도 계속된다.";
    }
}
