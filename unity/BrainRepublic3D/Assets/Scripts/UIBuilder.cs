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

            var t = MakeText(overlayPanel.transform, "두뇌공화국 3D", 64, new Color(1f, 0.85f, 0.63f), FontStyle.Bold);
            Pos(t.rectTransform, 0, 480, 680, 90);
            var st = MakeText(overlayPanel.transform, "기억 원정대 — 흩어진 기억 조각을 되찾아라", 26, new Color(0.79f, 0.72f, 0.91f));
            Pos(st.rectTransform, 0, 408, 680, 50);

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
            overlayPanel = MakePanel(new Color(0.06f, 0.03f, 0.12f, 0.86f));

            var t = MakeText(overlayPanel.transform, def.title, 46, def.theme, FontStyle.Bold);
            Pos(t.rectTransform, 0, 240, 660, 70);
            var k = MakeText(overlayPanel.transform, def.keeper, 28, new Color(1f, 0.85f, 0.63f), FontStyle.Bold);
            Pos(k.rectTransform, 0, 140, 660, 44);
            var line = MakeText(overlayPanel.transform, $"“{def.intro}”", 28, new Color(0.91f, 0.87f, 0.96f));
            Pos(line.rectTransform, 0, 40, 620, 120);
            var goal = MakeText(overlayPanel.transform,
                $"목표: 기억 조각 {def.needCrystals}개 이상 모아 게이트 통과\n조작: 드래그(또는 방향키)로 구슬 굴리기", 24, new Color(0.7f, 0.65f, 0.82f));
            Pos(goal.rectTransform, 0, -90, 620, 90);

            var btn = MakeButton(overlayPanel.transform, "출발!", new Color(1f, 0.55f, 0.26f), new Color(0.23f, 0.11f, 0.02f), () =>
            {
                ClearOverlay();
                onStart();
            });
            Pos(btn.GetComponent<RectTransform>(), 0, -240, 300, 100);
        }

        public void ShowHud(StageDef def)
        {
            ClearOverlay(); // 디버그 직행 등 어떤 경로로 와도 오버레이 잔존 방지
            HideHud();
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
        }

        public void UpdateHud(int crystals, int need, float time)
        {
            if (hudCrystals == null) return;
            hudCrystals.text = $"◆ {crystals}/{need}";
            hudTime.text = $"{Mathf.FloorToInt(time / 60)}:{Mathf.FloorToInt(time % 60):00}";
        }

        public void ShowClear(StageDef def, int stars, float time, bool hasNext)
        {
            HideHud();
            ClearOverlay();
            overlayPanel = MakePanel(new Color(0.06f, 0.03f, 0.12f, 0.9f));

            var t = MakeText(overlayPanel.transform, "STAGE CLEAR!", 56, new Color(1f, 0.85f, 0.63f), FontStyle.Bold);
            Pos(t.rectTransform, 0, 250, 660, 84);
            var s = MakeText(overlayPanel.transform, new string('★', stars) + new string('☆', 3 - stars), 72, new Color(1f, 0.8f, 0.2f));
            Pos(s.rectTransform, 0, 140, 660, 100);
            var info = MakeText(overlayPanel.transform,
                $"{def.title}\n기록 {Mathf.FloorToInt(time / 60)}:{Mathf.FloorToInt(time % 60):00}", 28, Color.white);
            Pos(info.rectTransform, 0, 20, 660, 90);

            var next = MakeButton(overlayPanel.transform, hasNext ? "다음 스테이지" : "전 스테이지 완주!", new Color(1f, 0.55f, 0.26f), new Color(0.23f, 0.11f, 0.02f),
                () => GameManager.I.NextStage());
            Pos(next.GetComponent<RectTransform>(), 0, -120, 380, 96);
            var retry = MakeButton(overlayPanel.transform, "다시 도전", new Color(0.25f, 0.2f, 0.38f), Color.white,
                () => GameManager.I.RetryStage());
            Pos(retry.GetComponent<RectTransform>(), -130, -240, 240, 80);
            var map = MakeButton(overlayPanel.transform, "스테이지 맵", new Color(0.25f, 0.2f, 0.38f), Color.white,
                () => GameManager.I.BackToSelect());
            Pos(map.GetComponent<RectTransform>(), 130, -240, 240, 80);
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
