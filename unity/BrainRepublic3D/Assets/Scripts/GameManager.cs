using UnityEngine;
using UnityEngine.SceneManagement;

namespace BrainRepublic
{
    // 게임 전체 흐름: 스테이지 선택 → 인트로 → 플레이 → 클리어/리스폰.
    // 부팅 씬의 빈 GameObject 하나에 붙는 유일한 진입점 (지오메트리는 전부 코드 생성).
    public class GameManager : MonoBehaviour
    {
        public static GameManager I;

        public bool Playing { get; private set; }

        int stageIndex = -1;
        StageDef def;
        GameObject stageRoot;
        GameObject player;
        Vector3[] checkpoints;
        int lastCheckpoint;
        int crystals;
        float stageTime;
        UIBuilder ui;
        Sfx sfx;

        void Awake()
        {
            I = this;
            Application.targetFrameRate = 60;
            ui = gameObject.AddComponent<UIBuilder>();
            sfx = gameObject.AddComponent<Sfx>();

            var camGo = Camera.main != null ? Camera.main.gameObject : new GameObject("Main Camera", typeof(Camera));
            camGo.tag = "MainCamera";
            camGo.AddComponent<CameraFollow>();
            var cam = camGo.GetComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.05f, 0.03f, 0.1f);

            var lightGo = new GameObject("Sun", typeof(Light));
            var sun = lightGo.GetComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 0.85f;
            sun.color = new Color(1f, 0.85f, 0.75f);
            lightGo.transform.rotation = Quaternion.Euler(55f, -25f, 0);
        }

        void Start() { ui.ShowStageSelect(BestStars()); }

        public int[] BestStars()
        {
            var arr = new int[StageDefs.All.Length];
            for (int i = 0; i < arr.Length; i++) arr[i] = PlayerPrefs.GetInt("stars_" + i, i == 0 ? 0 : -1); // -1 = 잠김
            if (arr[0] < 0) arr[0] = 0;
            return arr;
        }

        // ---- 스테이지 진행 ----

        public void StartStage(int idx)
        {
            stageIndex = idx;
            def = StageDefs.All[idx];
            if (stageRoot != null) Destroy(stageRoot);
            if (player != null) Destroy(player);

            stageRoot = StageBuilder.Build(def, out checkpoints);
            lastCheckpoint = 0;
            crystals = 0;
            stageTime = 0;
            player = PlayerController.Create(checkpoints[0]);
            Camera.main.GetComponent<CameraFollow>().target = player.transform;
            Camera.main.transform.position = player.transform.position + new Vector3(0, 7.5f, -8.5f);

            var pc = player.GetComponent<PlayerController>();
            if (skipIntroOnce)
            {
                skipIntroOnce = false;
                Playing = true;
                ui.ShowHud(def, pc);
            }
            else
            {
                ui.ShowIntro(def, () =>
                {
                    Playing = true;
                    ui.ShowHud(def, pc);
                    sfx.Play(Sfx.Kind.Start);
                });
            }
        }

        // ---- 스킬 (스테이지 i 클리어 = 스킬 i 해금) ----

        public bool HasSkill(Skill s)
        {
            if (s == Skill.None) return false;
            return PlayerPrefs.GetInt("stars_" + (int)s, -1) >= 1;
        }

        public void OnSkillUsed(Skill s)
        {
            sfx.Play(Sfx.Kind.Crystal);
            ui.RefreshSkillButtons();
        }

        // ---- 자동 검증 훅 (헤드리스 QA에서 SendMessage로 호출) ----
        bool skipIntroOnce;

        public void DebugPlayStage(int idx)
        {
            skipIntroOnce = true;
            StartStage(idx);
        }

        public void DebugPush(string xz)
        {
            if (player == null) return;
            var parts = xz.Split(',');
            var rb = player.GetComponent<Rigidbody>();
            rb.linearVelocity = new Vector3(float.Parse(parts[0]), 0, float.Parse(parts[1]));
        }

        public void DebugReport()
        {
            if (player == null) { Debug.Log("[REPORT] no player"); return; }
            var p = player.transform.position;
            Debug.Log($"[REPORT] pos {p.x:F2},{p.y:F2},{p.z:F2} crystals {crystals}");
        }

        void Update()
        {
            if (!Playing || player == null) return;
            stageTime += Time.deltaTime;
            ui.UpdateHud(crystals, def.needCrystals, stageTime);

            // 진행에 따라 체크포인트 갱신
            for (int i = lastCheckpoint + 1; i < checkpoints.Length; i++)
                if (player.transform.position.z > checkpoints[i].z) lastCheckpoint = i;

            // 추락
            if (player.transform.position.y < -6f) Respawn();
        }

        void Respawn()
        {
            sfx.Play(Sfx.Kind.Fall);
            ui.Flash(new Color(1f, 0.3f, 0.3f, 0.35f));
            player.GetComponent<PlayerController>().Teleport(checkpoints[lastCheckpoint]);
        }

        // ---- 이벤트 콜백 ----

        public void OnCrystal()
        {
            crystals++;
            sfx.Play(Sfx.Kind.Crystal);
            ui.UpdateHud(crystals, def.needCrystals, stageTime);
        }

        public void OnHit()
        {
            // 수막 방패: 해금 + 충전 완료 시 자동으로 한 번 막아준다
            var pc = player.GetComponent<PlayerController>();
            if (HasSkill(Skill.Shield) && pc.ConsumeShield())
            {
                sfx.Play(Sfx.Kind.Crystal);
                ui.Flash(new Color(0.3f, 0.8f, 1f, 0.4f));
                ui.Toast("수막 방패가 위험을 막았다!");
                ui.RefreshSkillButtons();
                return;
            }
            sfx.Play(Sfx.Kind.Hit);
            ui.Flash(new Color(1f, 0.2f, 0.2f, 0.4f));
            Respawn();
        }

        public void OnWordCorrect() { sfx.Play(Sfx.Kind.Crystal); }

        public void OnWordWrong()
        {
            sfx.Play(Sfx.Kind.Hit);
            stageTime += 3f; // 말실수 페널티
            ui.Flash(new Color(1f, 0.6f, 0.1f, 0.35f));
        }

        public void OnGate()
        {
            if (!Playing) return;
            if (crystals < def.needCrystals)
            {
                ui.Toast($"기억 조각이 부족합니다! ({crystals}/{def.needCrystals})");
                sfx.Play(Sfx.Kind.Hit);
                return;
            }
            Playing = false;
            Time.timeScale = 1f;
            int stars = stageTime <= def.starTime3 ? 3 : stageTime <= def.starTime2 ? 2 : 1;
            int prev = PlayerPrefs.GetInt("stars_" + stageIndex, -1);
            bool firstClear = prev < 1;
            if (stars > prev) PlayerPrefs.SetInt("stars_" + stageIndex, stars);
            if (stageIndex + 1 < StageDefs.All.Length && PlayerPrefs.GetInt("stars_" + (stageIndex + 1), -1) < 0)
                PlayerPrefs.SetInt("stars_" + (stageIndex + 1), 0); // 다음 에피소드 해금
            PlayerPrefs.Save();
            sfx.Play(Sfx.Kind.Clear);

            if (stageIndex == StageDefs.All.Length - 1)
                ui.ShowEnding(StageDefs.EndingStory, stars);
            else
                ui.ShowClear(def, stars, stageTime, true,
                    firstClear && def.grants != Skill.None ? def.skillName : null, def.skillDesc);
        }

        public void NextStage()
        {
            if (stageIndex + 1 < StageDefs.All.Length) StartStage(stageIndex + 1);
            else BackToSelect();
        }

        public void RetryStage() { StartStage(stageIndex); }

        public void BackToSelect()
        {
            Playing = false;
            if (stageRoot != null) Destroy(stageRoot);
            if (player != null) Destroy(player);
            ui.ShowStageSelect(BestStars());
        }
    }
}
