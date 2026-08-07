using UnityEngine;

namespace BrainRepublic
{
    // 기억 조각
    public class Collectible : MonoBehaviour
    {
        float baseY;

        void Start() { baseY = transform.position.y; }

        void Update()
        {
            transform.Rotate(0, 90 * Time.deltaTime, 0);
            var p = transform.position;
            p.y = baseY + Mathf.Sin(Time.time * 2.4f + baseY) * 0.15f;
            transform.position = p;
        }

        void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            GameManager.I.OnCrystal();
            Destroy(gameObject);
        }
    }

    // 접촉 시 리스폰되는 위험물
    public class Hazard : MonoBehaviour
    {
        void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            GameManager.I.OnHit();
        }
    }

    // 좌우 왕복 이동체
    public class MovingPlatform : MonoBehaviour
    {
        public Vector3 axis;
        public float speed = 1f;
        Vector3 origin;

        void Start() { origin = transform.position; }

        void Update()
        {
            transform.position = origin + axis * Mathf.Sin(Time.time * speed);
        }
    }

    // 감속 지대 (눈물 웅덩이)
    public class SlowZone : MonoBehaviour
    {
        void OnTriggerStay(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            var rb = other.attachedRigidbody;
            if (rb != null) rb.linearVelocity *= 0.94f;
        }
    }

    // 도착 게이트
    public class Gate : MonoBehaviour
    {
        void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            GameManager.I.OnGate();
        }
    }

    // 언어의 관문: 두 개의 문 중 올바른 표현으로만 통과
    public class WordGate : MonoBehaviour
    {
        public bool correct;

        public static void Create(Transform parent, float z, string good, string bad, Color theme)
        {
            bool goodLeft = Random.value < 0.5f;
            MakeDoor(parent, new Vector3(-1.8f, 0, z), goodLeft ? good : bad, goodLeft, theme);
            MakeDoor(parent, new Vector3(1.8f, 0, z), goodLeft ? bad : good, !goodLeft, theme);
            // 중앙 기둥 (통과 불가)
            var mid = GameObject.CreatePrimitive(PrimitiveType.Cube);
            mid.transform.SetParent(parent);
            mid.transform.position = new Vector3(0, 1.4f, z);
            mid.transform.localScale = new Vector3(0.6f, 2.8f, 0.6f);
            mid.GetComponent<Renderer>().sharedMaterial = StageBuilder.MatSolid(Color.Lerp(theme, Color.black, 0.4f));
        }

        static void MakeDoor(Transform parent, Vector3 pos, string label, bool correct, Color theme)
        {
            var door = GameObject.CreatePrimitive(PrimitiveType.Cube);
            door.name = "wordDoor";
            door.transform.SetParent(parent);
            door.transform.position = new Vector3(pos.x, 1.4f, pos.z);
            door.transform.localScale = new Vector3(3.0f, 2.8f, 0.4f);
            var m = StageBuilder.MatEmissive(theme, 0.6f);
            m.color = new Color(theme.r, theme.g, theme.b, 0.45f);
            door.GetComponent<Renderer>().sharedMaterial = m;
            door.GetComponent<Collider>().isTrigger = true;
            var wg = door.AddComponent<WordGate>();
            wg.correct = correct;

            var textGo = new GameObject("label");
            textGo.transform.SetParent(door.transform);
            textGo.transform.localPosition = new Vector3(0, 0.1f, -0.6f);
            textGo.transform.localScale = new Vector3(1f / 3.0f, 1f / 2.8f, 1f) * 0.14f;
            var tm = textGo.AddComponent<TextMesh>();
            tm.text = label;
            tm.fontSize = 64;
            tm.characterSize = 1.6f;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.alignment = TextAlignment.Center;
            tm.color = Color.white;
            // WebGL은 OS 폰트 폴백이 없어 한글 폰트를 직접 지정해야 함
            if (UIBuilder.KFont != null)
            {
                tm.font = UIBuilder.KFont;
                textGo.GetComponent<MeshRenderer>().sharedMaterial = UIBuilder.KFont.material;
            }
        }

        void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            if (correct)
            {
                GameManager.I.OnWordCorrect();
                foreach (var d in transform.parent.GetComponentsInChildren<WordGate>())
                    if (Mathf.Abs(d.transform.position.z - transform.position.z) < 2f)
                        Destroy(d.gameObject);
            }
            else
            {
                // 오답: 튕겨내고 페널티
                var rb = other.attachedRigidbody;
                if (rb != null)
                {
                    rb.linearVelocity = Vector3.zero;
                    rb.AddForce(new Vector3(0, 2f, -9f), ForceMode.VelocityChange);
                }
                GameManager.I.OnWordWrong();
            }
        }
    }

    // 추락 감지는 GameManager가 y 좌표로 직접 처리
}
