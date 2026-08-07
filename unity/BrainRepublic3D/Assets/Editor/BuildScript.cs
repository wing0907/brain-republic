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
            PlayerSettings.WebGL.template = "APPLICATION:Default";
            PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.WebGL, ScriptingImplementation.IL2CPP);
            AssetDatabase.SaveAssets();
            Debug.Log("[BuildScript] Setup done");
        }

        public static void BuildWebGL()
        {
            var report = BuildPipeline.BuildPlayer(
                new[] { "Assets/Scenes/Main.unity" },
                Path.Combine(Directory.GetParent(Application.dataPath).Parent.FullName, "unity-build"),
                BuildTarget.WebGL,
                BuildOptions.None);
            Debug.Log($"[BuildScript] Build result: {report.summary.result}, size {report.summary.totalSize / (1024 * 1024)}MB, errors {report.summary.totalErrors}");
            if (report.summary.result != UnityEditor.Build.Reporting.BuildResult.Succeeded)
                EditorApplication.Exit(1);
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
            AssetDatabase.Refresh();
            Debug.Log("[SfxGen] wav files generated");
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
