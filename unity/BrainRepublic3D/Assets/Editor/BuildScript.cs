using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BrainRepublic.EditorTools
{
    // CLI 자동화: 씬 생성 → 효과음 WAV 생성 → WebGL 빌드.
    //   Unity -batchmode -projectPath <p> -executeMethod BrainRepublic.EditorTools.BuildScript.SetupAndBuild -quit
    public static class BuildScript
    {
        public static void Setup()
        {
            SfxGen.GenerateAll();

            // 셰이더 스트리핑 방지: 런타임 생성 머티리얼이 쓰는 셰이더를
            // Resources 내 에셋으로 참조시켜 빌드에 강제 포함한다.
            Directory.CreateDirectory("Assets/Resources/ShaderRefs");
            CreateRefMat("Standard", "Assets/Resources/ShaderRefs/std.mat");
            CreateRefMat("UI/Default", "Assets/Resources/ShaderRefs/ui.mat");
            CreateRefMat("GUI/Text Shader", "Assets/Resources/ShaderRefs/text.mat");
            CreateRefMat("Skybox/Procedural", "Assets/Resources/ShaderRefs/sky.mat");

            // 부팅 씬: GameManager 하나가 전부를 조립한다
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            var go = new GameObject("Game");
            go.AddComponent<BrainRepublic.GameManager>();
            Directory.CreateDirectory("Assets/Scenes");
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/Main.unity");
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene("Assets/Scenes/Main.unity", true) };

            PlayerSettings.productName = "두뇌공화국 3D: 기억 원정대";
            PlayerSettings.companyName = "뇌지컬연구소";
            PlayerSettings.defaultWebScreenWidth = 720;
            PlayerSettings.defaultWebScreenHeight = 1280;
            PlayerSettings.runInBackground = false;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true; // GitHub Pages는 Content-Encoding 미설정
            PlayerSettings.WebGL.memorySize = 256;
            PlayerSettings.stripEngineCode = false; // 런타임 생성 위주라 모듈 스트리핑 금지
            PlayerSettings.WebGL.template = "APPLICATION:Default";
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.WebGL, ScriptingImplementation.IL2CPP);
            AssetDatabase.SaveAssets();
            Debug.Log("[BuildScript] Setup done");
        }

        static void CreateRefMat(string shaderName, string path)
        {
            var sh = Shader.Find(shaderName);
            if (sh == null) { Debug.LogWarning("[BuildScript] shader not found: " + shaderName); return; }
            if (AssetDatabase.LoadAssetAtPath<Material>(path) != null) return;
            AssetDatabase.CreateAsset(new Material(sh), path);
        }

        public static void BuildWebGL()
        {
            var outDir = Path.Combine(Directory.GetParent(Application.dataPath).Parent.FullName, "unity-build");
            var report = BuildPipeline.BuildPlayer(
                new[] { "Assets/Scenes/Main.unity" },
                outDir,
                BuildTarget.WebGL,
                BuildOptions.None);
            Debug.Log($"[BuildScript] Build result: {report.summary.result}, size {report.summary.totalSize / (1024 * 1024)}MB, errors {report.summary.totalErrors}");
            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                EditorApplication.Exit(1);
                return;
            }

            // 모바일/데스크톱 공통 반응형 캔버스 CSS 주입 (기본 템플릿은 고정 크기)
            var html = Path.Combine(outDir, "index.html");
            if (File.Exists(html))
            {
                var s = File.ReadAllText(html);
                if (!s.Contains("name=\"viewport\""))
                    s = s.Replace("<head>", "<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover\">");
                // 자동 QA용 인스턴스 노출 (SendMessage 호출 경로)
                s = s.Replace("}).then((unityInstance) => {", "}).then((unityInstance) => { window.unityInstance = unityInstance;");
                const string css = "<style>html,body{margin:0;padding:0;background:#12081f;height:100%;overflow:hidden}" +
                    "#unity-container{position:fixed;inset:0;width:100vw!important;height:100vh!important;display:flex;align-items:center;justify-content:center}" +
                    "#unity-canvas{max-width:100vw!important;max-height:100vh!important;width:auto!important;height:100%!important;background:#12081f}" +
                    "#unity-footer{display:none}</style></head>";
                s = s.Replace("</head>", css);
                File.WriteAllText(html, s);
                Debug.Log("[BuildScript] index.html responsive patch applied");
            }
        }

        public static void SetupAndBuild()
        {
            Setup();
            BuildWebGL();
        }
    }

    // 프로시저럴 WAV 생성기 — 16bit mono 22050Hz PCM
    public static class SfxGen
    {
        const int SR = 22050;

        public static void GenerateAll()
        {
            Directory.CreateDirectory("Assets/Resources/Sfx");
            Write("start", Sequence(new[] { (392f, 0.1f), (523f, 0.1f), (659f, 0.1f), (784f, 0.18f) }));
            Write("crystal", Sequence(new[] { (988f, 0.06f), (1319f, 0.1f) }));
            Write("hit", Noise(0.15f, 900f));
            Write("fall", Slide(440f, 110f, 0.4f));
            Write("clear", Sequence(new[] { (523f, 0.14f), (659f, 0.14f), (784f, 0.14f), (1046f, 0.3f) }));
            Write("bgm", Music());
            AssetDatabase.Refresh();
            Debug.Log("[SfxGen] wav files generated (incl. bgm loop)");
        }

        // 테마 BGM: 따뜻한 노을빛 로파이 루프 (C–Am–F–G ×2, 80bpm, 24초).
        // 패드(사인 3화음) + 베이스 + 아르페지오(삼각파) + 옅은 해트 노이즈.
        static float[] Music()
        {
            const float bpm = 80f;
            float beat = 60f / bpm;
            int bars = 8;
            int len = (int)(bars * 4 * beat * SR);
            var mix = new float[len];

            // 코드 진행 (주파수, 낮은 옥타브 기준): C E G / A C E / F A C / G B D
            float[][] chords =
            {
                new[] { 261.6f, 329.6f, 392.0f },
                new[] { 220.0f, 261.6f, 329.6f },
                new[] { 174.6f, 220.0f, 261.6f },
                new[] { 196.0f, 246.9f, 293.7f }
            };

            var rnd = new System.Random(42);
            float hatPrev = 0;
            for (int i = 0; i < len; i++)
            {
                float t = (float)i / SR;
                int bar = (int)(t / (4 * beat)) % 8;
                var chord = chords[bar % 4];
                float barT = t % (4 * beat);

                // 패드: 부드러운 어택의 3화음
                float pad = 0;
                foreach (var f in chord)
                    pad += Mathf.Sin(2 * Mathf.PI * f * t);
                float padEnv = Mathf.Min(1f, barT / 0.4f) * (1f - Mathf.Max(0, (barT - 4 * beat + 0.5f)) / 0.5f);
                pad *= 0.1f * Mathf.Clamp01(padEnv);

                // 베이스: 1·3박 루트 (한 옥타브 아래)
                float beatT = barT % (2 * beat);
                float bass = Mathf.Sin(2 * Mathf.PI * (chord[0] / 2f) * t) * Mathf.Exp(-beatT * 2.2f) * 0.22f;

                // 아르페지오: 8분음표 삼각파 (한 옥타브 위)
                int eighth = (int)(barT / (beat / 2f));
                float arpF = chord[eighth % 3] * 2f;
                float arpT = barT % (beat / 2f);
                float tri = Mathf.PingPong(arpF * t * 2f, 1f) * 2f - 1f;
                float arp = tri * Mathf.Exp(-arpT * 5f) * 0.10f;

                // 해트: 오프비트 옅은 노이즈
                float hatT = (barT + beat / 2f) % beat;
                float white = (float)(rnd.NextDouble() * 2 - 1);
                hatPrev = hatPrev + 0.55f * (white - hatPrev);
                float hat = (white - hatPrev) * Mathf.Exp(-hatT * 28f) * 0.09f;

                mix[i] = pad + bass + arp + hat;
            }
            return mix;
        }

        static float[] Sequence((float freq, float dur)[] notes)
        {
            int total = 0;
            foreach (var n in notes) total += (int)(n.dur * SR);
            var data = new float[total];
            int at = 0;
            foreach (var n in notes)
            {
                int len = (int)(n.dur * SR);
                for (int i = 0; i < len; i++)
                {
                    float env = 1f - (float)i / len;
                    data[at + i] = Mathf.Sin(2 * Mathf.PI * n.freq * i / SR) * env * 0.55f;
                }
                at += len;
            }
            return data;
        }

        static float[] Noise(float dur, float lowpassApprox)
        {
            int len = (int)(dur * SR);
            var data = new float[len];
            var rnd = new System.Random(7);
            float prev = 0;
            float a = Mathf.Clamp01(lowpassApprox / (SR / 2f));
            for (int i = 0; i < len; i++)
            {
                float white = (float)(rnd.NextDouble() * 2 - 1);
                prev = prev + a * (white - prev); // 1폴 저역통과
                data[i] = prev * (1f - (float)i / len) * 0.9f;
            }
            return data;
        }

        static float[] Slide(float f0, float f1, float dur)
        {
            int len = (int)(dur * SR);
            var data = new float[len];
            float phase = 0;
            for (int i = 0; i < len; i++)
            {
                float t = (float)i / len;
                float f = Mathf.Lerp(f0, f1, t);
                phase += 2 * Mathf.PI * f / SR;
                data[i] = Mathf.Sin(phase) * (1f - t) * 0.5f;
            }
            return data;
        }

        static void Write(string name, float[] samples)
        {
            var path = $"Assets/Resources/Sfx/{name}.wav";
            using var fs = new FileStream(path, FileMode.Create);
            using var bw = new BinaryWriter(fs);
            int dataLen = samples.Length * 2;
            bw.Write(System.Text.Encoding.ASCII.GetBytes("RIFF"));
            bw.Write(36 + dataLen);
            bw.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt "));
            bw.Write(16);
            bw.Write((short)1);       // PCM
            bw.Write((short)1);       // mono
            bw.Write(SR);
            bw.Write(SR * 2);         // byte rate
            bw.Write((short)2);       // block align
            bw.Write((short)16);      // bits
            bw.Write(System.Text.Encoding.ASCII.GetBytes("data"));
            bw.Write(dataLen);
            foreach (var s in samples)
                bw.Write((short)(Mathf.Clamp(s, -1f, 1f) * short.MaxValue));
        }
    }
}
