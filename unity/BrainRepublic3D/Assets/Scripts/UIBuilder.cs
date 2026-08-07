using System;
using UnityEngine;
using UnityEngine.UI;

namespace BrainRepublic
{
    // 전 UI를 코드로 조립 (씬/프리팹 의존 없음).
    // 한글 표시: Assets/Resources/Fonts/Pretendard(OFL 라이선스)를 동적 폰트로 사용
    // — WebGL은 OS 폰트 폴백이 없으므로 폰트 번들이 필수.
    public class UIBuilder : MonoBehaviour
    {
        public static Font KFont;

        Canvas canvas;
        RectTransform root;
        GameObject hudPanel;
        GameObject overlayPanel;
        Text hudTitle, hudCrystals, hudTime;
        Image flashImg;
        Text toastText;

        void Awake()
        {
            KFont = Resources.Load<Font>("Fonts/Pretendard");
            if (KFont == null) KFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            var go = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvas = go.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = go.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(720, 1280);
            scaler.matchWidthOrHeight = 0.5f;
            root = go.GetComponent<RectTransform>();

            if (UnityEngine.EventSystems.EventSystem.current == null)
            {
                new GameObject("EventSystem",
                    typeof(UnityEngine.EventSystems.EventSystem),
                    typeof(UnityEngine.EventSystems.StandaloneInputModule));
            }

            // 전면 플래시 (피격 연출)
            flashImg = MakeImage(root, new Color(0, 0, 0, 0));
            Stretch(flashImg.rectTransform);
            flashImg.raycastTarget = false;

            toastText = MakeText(root, "", 30, new Color(1f, 0.95f, 0.8f), FontStyle.Bold);
            Pos(toastText.rectTransform, 0, 380, 660, 90);
            toastText.gameObject.SetActive(false);
        }

        // ---------- 화면들 ----------

        public void ShowStageSelect(int[] stars)
        {
            ClearOverlay();
            HideHud();
            overlayPanel = MakePanel(new Color(0.06f, 0.03f, 0.12f, 0.97f));

            var t = MakeText(overlayPanel.transform, "두뇌공화국 3D", 64, new Color(0.55f, 0.95f, 1f), FontStyle.Bold);
            Pos(t.rectTransform, 0, 490, 680, 90);
            var st = MakeText(overlayPanel.transform, "코어 원정대 — 산산조각 난 홀로그램 기억 코어를 복원하라\n에피소드를 클리어하면 국장의 능력을 하나씩 빌릴 수 있다", 24, new Color(0.75f, 0.82f, 1f));
            Pos(st.rectTransform, 0, 400, 680, 80);

            for (int i = 0; i < StageDefs.All.Length; i++)
            {
                var def = StageDefs.All[i];
                bool locked = stars[i] < 0;
                int idx = i;
                string starStr = stars[i] > 0 ? new string('★', stars[i]) + new string('☆', 3 - stars[i]) : locked ? "🔒" : "미클리어";
                var btn = MakeButton(overlayPanel.transform,
                    $"{def.title}\n{starStr}",
                    locked ? new Color(0.2f, 0.16f, 0.3f) : Color.Lerp(def.theme, Color.black, 0.45f),
                    locked ? new Color(0.5f, 0.45f, 0.6f) : Color.white,
                    () => { if (!locked) GameManager.I.StartStage(idx); });
                Pos(btn.GetComponent<RectTransform>(), (i % 2 == 0 ? -170 : 170), 300 - (i / 2) * 150, 320, 128);
            }

            var credit = MakeText(overlayPanel.transform, "원작·기획 성지은 · 팀 뇌지컬연구소\nNAN 2026 — NHN Game × AI Hackathon", 20, new Color(0.55f, 0.5f, 0.68f));
            Pos(credit.rectTransform, 0, -530, 680, 70);
        }

        public void ShowIntro(StageDef def, Action onStart)
        {
            ClearOverlay();
            overlayPanel = MakePanel(new Color(0.03f, 0.02f, 0.1f, 0.92f));

            var t = MakeText(overlayPanel.transform, def.title, 44, def.theme, FontStyle.Bold);
            Pos(t.rectTransform, 0, 330, 660, 70);
            var story = MakeText(overlayPanel.transform, def.story, 26, new Color(0.75f, 0.82f, 1f), FontStyle.Italic);
            Pos(story.rectTransform, 0, 220, 620, 130);
            var k = MakeText(overlayPanel.transform, def.keeper, 28, new Color(1f, 0.85f, 0.63f), FontStyle.Bold);
            Pos(k.rectTransform, 0, 110, 660, 44);
            var line = MakeText(overlayPanel.transform, $"“{def.intro}”", 27, new Color(0.91f, 0.87f, 0.96f));
            Pos(line.rectTransform, 0, 20, 620, 120);

            // 보유 스킬 안내
            string skills = "";
            string[] names = { "🦘도약", "💨질주", "🛡수막 방패", "⏳시간 제동", "🧲기억 자석" };
            for (int i = 0; i < 5; i++)
                if (GameManager.I.HasSkill((Skill)i)) skills += (skills.Length > 0 ? "  " : "") + names[i];
            var goal = MakeText(overlayPanel.transform,
                $"목표: 기억 파편 {def.needCrystals}개 이상 모아 게이트 통과\n" +
                (skills.Length > 0 ? $"보유 능력: {skills}" : "아직 빌린 능력이 없다 — 첫 원정이다!"),
                24, new Color(0.7f, 0.75f, 0.92f));
            Pos(goal.rectTransform, 0, -110, 640, 100);

            var btn = MakeButton(overlayPanel.transform, "원정 출발!", new Color(0.35f, 0.85f, 1f), new Color(0.02f, 0.1f, 0.16f), () =>
            {
                ClearOverlay();
                onStart();
            });
            Pos(btn.GetComponent<RectTransform>(), 0, -260, 320, 100);
        }

        PlayerController pc;
        Text[] skillBtnTexts;
        Image[] skillBtnImgs;
        static readonly Skill[] ActiveSkills = { Skill.Jump, Skill.Dash, Skill.Focus, Skill.Magnet };
        static readonly string[] SkillLabels = { "🦘\n도약", "💨\n질주", "⏳\n제동", "🧲\n자석" };

        public void ShowHud(StageDef def, PlayerController playerCtrl)
        {
            ClearOverlay(); // 디버그 직행 등 어떤 경로로 와도 오버레이 잔존 방지
            HideHud();
            pc = playerCtrl;
            hudPanel = new GameObject("HUD", typeof(RectTransform));
            hudPanel.transform.SetParent(root, false);
            hudTitle = MakeText(hudPanel.transform, def.title, 26, def.theme, FontStyle.Bold);
            Pos(hudTitle.rectTransform, 0, 590, 660, 44);
            hudCrystals = MakeText(hudPanel.transform, "", 30, new Color(1f, 0.92f, 0.55f), FontStyle.Bold);
            Pos(hudCrystals.rectTransform, -220, 540, 240, 44);
            hudTime = MakeText(hudPanel.transform, "", 30, Color.white, FontStyle.Bold);
            Pos(hudTime.rectTransform, 220, 540, 240, 44);

            var quit = MakeButton(hudPanel.transform, "포기", new Color(0.25f, 0.2f, 0.38f), new Color(0.85f, 0.8f, 0.95f),
                () => GameManager.I.BackToSelect());
            Pos(quit.GetComponent<RectTransform>(), 300, 590, 110, 56);

            // 스킬 버튼 (해금된 것만)
            skillBtnTexts = new Text[ActiveSkills.Length];
            skillBtnImgs = new Image[ActiveSkills.Length];
            int shown = 0;
            for (int i = 0; i < ActiveSkills.Length; i++)
            {
                if (!GameManager.I.HasSkill(ActiveSkills[i])) continue;
                var skill = ActiveSkills[i];
                var btn = MakeButton(hudPanel.transform, SkillLabels[i], new Color(0.1f, 0.25f, 0.4f, 0.92f), Color.white, () =>
                {
                    if (skill == Skill.Jump) pc.TryJump();
                    else if (skill == Skill.Dash) pc.TryDash();
                    else if (skill == Skill.Focus) pc.TryFocus();
                    else if (skill == Skill.Magnet) pc.TryMagnet();
                });
                Pos(btn.GetComponent<RectTransform>(), -240 + shown * 150, -540, 130, 120);
                skillBtnImgs[i] = btn.GetComponent<Image>();
                skillBtnTexts[i] = btn.GetComponentInChildren<Text>();
                shown++;
            }
            // 방패 상태 표시
            if (GameManager.I.HasSkill(Skill.Shield))
            {
                var shield = MakeText(hudPanel.transform, "🛡", 40, Color.white);
                Pos(shield.rectTransform, 300, -540, 100, 120);
                skillShieldText = shield;
            }
        }

        Text skillShieldText;

        public void RefreshSkillButtons()
        {
            if (pc == null || skillBtnTexts == null) return;
            float[] cds = { 0, pc.dashCd, pc.focusCd, pc.magnetCd };
            for (int i = 0; i < ActiveSkills.Length; i++)
            {
                if (skillBtnTexts[i] == null) continue;
                float cd = cds[i];
                bool ready = cd <= 0.01f;
                skillBtnTexts[i].text = ready ? SkillLabels[i] : $"{SkillLabels[i].Split('\n')[0]}\n{cd:0.0}s";
                skillBtnImgs[i].color = ready ? new Color(0.1f, 0.35f, 0.55f, 0.95f) : new Color(0.1f, 0.12f, 0.2f, 0.8f);
            }
            if (skillShieldText != null)
                skillShieldText.color = pc.ShieldReady ? new Color(0.4f, 0.9f, 1f) : new Color(0.3f, 0.3f, 0.4f);
        }

        public void UpdateHud(int crystals, int need, float time)
        {
            if (hudCrystals == null) return;
            hudCrystals.text = $"◆ {crystals}/{need}";
            hudTime.text = $"{Mathf.FloorToInt(time / 60)}:{Mathf.FloorToInt(time % 60):00}";
            RefreshSkillButtons();
        }

        public void ShowClear(StageDef def, int stars, float time, bool hasNext, string newSkillName, string newSkillDesc)
        {
            HideHud();
            ClearOverlay();
            overlayPanel = MakePanel(new Color(0.03f, 0.02f, 0.1f, 0.92f));

            var t = MakeText(overlayPanel.transform, "EPISODE CLEAR!", 52, new Color(1f, 0.85f, 0.63f), FontStyle.Bold);
            Pos(t.rectTransform, 0, 330, 660, 84);
            var s = MakeText(overlayPanel.transform, new string('★', stars) + new string('☆', 3 - stars), 66, new Color(1f, 0.8f, 0.2f));
            Pos(s.rectTransform, 0, 240, 660, 90);
            var info = MakeText(overlayPanel.transform,
                $"{def.title}\n기록 {Mathf.FloorToInt(time / 60)}:{Mathf.FloorToInt(time % 60):00}", 27, Color.white);
            Pos(info.rectTransform, 0, 150, 660, 90);

            // 새 스킬 획득 배너
            if (!string.IsNullOrEmpty(newSkillName))
            {
                var bannerBg = MakeImage(overlayPanel.transform, new Color(0.1f, 0.3f, 0.45f, 0.95f));
                Pos(bannerBg.rectTransform, 0, 20, 560, 150);
                var bn = MakeText(bannerBg.transform, $"✦ 새 능력 획득 — 「{newSkillName}」 ✦", 30, new Color(0.55f, 0.95f, 1f), FontStyle.Bold);
                Pos(bn.rectTransform, 0, 34, 540, 50);
                var bd = MakeText(bannerBg.transform, newSkillDesc, 23, new Color(0.85f, 0.92f, 1f));
                Pos(bd.rectTransform, 0, -28, 520, 70);
            }

            var next = MakeButton(overlayPanel.transform, hasNext ? "다음 에피소드" : "원정 완료!", new Color(0.35f, 0.85f, 1f), new Color(0.02f, 0.1f, 0.16f),
                () => GameManager.I.NextStage());
            Pos(next.GetComponent<RectTransform>(), 0, -140, 380, 96);
            var retry = MakeButton(overlayPanel.transform, "다시 도전", new Color(0.25f, 0.2f, 0.38f), Color.white,
                () => GameManager.I.RetryStage());
            Pos(retry.GetComponent<RectTransform>(), -130, -260, 240, 80);
            var map = MakeButton(overlayPanel.transform, "에피소드 맵", new Color(0.25f, 0.2f, 0.38f), Color.white,
                () => GameManager.I.BackToSelect());
            Pos(map.GetComponent<RectTransform>(), 130, -260, 240, 80);
        }

        // 최종화 클리어: 코어 복원 엔딩
        public void ShowEnding(string story, int stars)
        {
            HideHud();
            ClearOverlay();
            overlayPanel = MakePanel(new Color(0.02f, 0.02f, 0.09f, 0.96f));

            var t = MakeText(overlayPanel.transform, "✦ 기억 코어 복원 ✦", 52, new Color(0.55f, 0.95f, 1f), FontStyle.Bold);
            Pos(t.rectTransform, 0, 330, 660, 84);
            var s = MakeText(overlayPanel.transform, new string('★', stars) + new string('☆', 3 - stars), 60, new Color(1f, 0.8f, 0.2f));
            Pos(s.rectTransform, 0, 240, 660, 80);
            var body = MakeText(overlayPanel.transform, story, 27, new Color(0.88f, 0.92f, 1f));
            Pos(body.rectTransform, 0, 20, 620, 320);
            var credit = MakeText(overlayPanel.transform, "원작·기획 성지은 · 팀 뇌지컬연구소", 22, new Color(0.55f, 0.5f, 0.68f));
            Pos(credit.rectTransform, 0, -220, 660, 40);

            var map = MakeButton(overlayPanel.transform, "에피소드 맵으로", new Color(0.35f, 0.85f, 1f), new Color(0.02f, 0.1f, 0.16f),
                () => GameManager.I.BackToSelect());
            Pos(map.GetComponent<RectTransform>(), 0, -330, 380, 96);
        }

        // ---------- 연출 ----------

        public void Flash(Color c)
        {
            StopAllCoroutines();
            StartCoroutine(FlashCo(c));
        }

        System.Collections.IEnumerator FlashCo(Color c)
        {
            flashImg.color = c;
            float t = 0;
            while (t < 0.4f)
            {
                t += Time.deltaTime;
                flashImg.color = Color.Lerp(c, Color.clear, t / 0.4f);
                yield return null;
            }
            flashImg.color = Color.clear;
        }

        public void Toast(string msg)
        {
            toastText.text = msg;
            toastText.gameObject.SetActive(true);
            CancelInvoke(nameof(HideToast));
            Invoke(nameof(HideToast), 1.8f);
        }

        void HideToast() { toastText.gameObject.SetActive(false); }

        // ---------- 조립 유틸 ----------

        void ClearOverlay() { if (overlayPanel != null) Destroy(overlayPanel); }
        void HideHud() { if (hudPanel != null) Destroy(hudPanel); }

        GameObject MakePanel(Color bg)
        {
            var img = MakeImage(root, bg);
            Stretch(img.rectTransform);
            return img.gameObject;
        }

        Image MakeImage(Transform parent, Color c)
        {
            var go = new GameObject("img", typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = c;
            return img;
        }

        Text MakeText(Transform parent, string content, int size, Color c, FontStyle style = FontStyle.Normal)
        {
            var go = new GameObject("txt", typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var txt = go.GetComponent<Text>();
            txt.font = KFont;
            txt.text = content;
            txt.fontSize = size;
            txt.color = c;
            txt.fontStyle = style;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.horizontalOverflow = HorizontalWrapMode.Wrap;
            txt.verticalOverflow = VerticalWrapMode.Overflow;
            txt.raycastTarget = false;
            return txt;
        }

        GameObject MakeButton(Transform parent, string label, Color bg, Color fg, Action onClick)
        {
            var img = MakeImage(parent, bg);
            var go = img.gameObject;
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.onClick.AddListener(() => onClick());
            var txt = MakeText(go.transform, label, 28, fg, FontStyle.Bold);
            Stretch(txt.rectTransform);
            return go;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        static void Pos(RectTransform rt, float x, float y, float w, float h)
        {
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = new Vector2(x, y);
            rt.sizeDelta = new Vector2(w, h);
        }
    }
}
