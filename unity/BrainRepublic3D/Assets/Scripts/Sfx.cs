using UnityEngine;

namespace BrainRepublic
{
    // 효과음 재생 — 클립은 에디터 빌드 단계에서 프로시저럴 생성된 WAV
    // (Assets/Resources/Sfx/*, SfxGen.cs 참조). 외부 사운드 에셋 없음.
    public class Sfx : MonoBehaviour
    {
        public enum Kind { Start, Crystal, Hit, Fall, Clear }

        AudioSource src;
        AudioClip[] clips;

        void Awake()
        {
            src = gameObject.AddComponent<AudioSource>();
            src.playOnAwake = false;
            clips = new AudioClip[5];
            clips[(int)Kind.Start] = Resources.Load<AudioClip>("Sfx/start");
            clips[(int)Kind.Crystal] = Resources.Load<AudioClip>("Sfx/crystal");
            clips[(int)Kind.Hit] = Resources.Load<AudioClip>("Sfx/hit");
            clips[(int)Kind.Fall] = Resources.Load<AudioClip>("Sfx/fall");
            clips[(int)Kind.Clear] = Resources.Load<AudioClip>("Sfx/clear");

            if (Camera.main != null && Camera.main.GetComponent<AudioListener>() == null)
                Camera.main.gameObject.AddComponent<AudioListener>();

            // 테마 BGM 루프 (프로시저럴 생성 WAV) — WebGL은 첫 입력 후 소리가 열린다
            var bgm = Resources.Load<AudioClip>("Sfx/bgm");
            if (bgm != null)
            {
                var bgmSrc = gameObject.AddComponent<AudioSource>();
                bgmSrc.clip = bgm;
                bgmSrc.loop = true;
                bgmSrc.volume = 0.3f;
                bgmSrc.playOnAwake = false;
                bgmSrc.Play();
            }
        }

        public void Play(Kind k)
        {
            var clip = clips[(int)k];
            if (clip != null) src.PlayOneShot(clip, 0.55f);
        }
    }
}
