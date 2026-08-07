using UnityEngine;

namespace BrainRepublic
{
    // 기억 구슬 조작: 드래그(모바일/마우스) 또는 WASD/화살표.
    // 드래그 벡터 = 가속 방향 (화면 위쪽 = 전진 +z).
    public class PlayerController : MonoBehaviour
    {
        public float force = 22f;
        public float maxSpeed = 9f;

        Rigidbody rb;
        Vector2 dragStart;
        bool dragging;
        Vector2 dragInput;

        public static GameObject Create(Vector3 pos)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            go.name = "Player";
            go.tag = "Player";
            go.transform.position = pos;
            go.transform.localScale = Vector3.one * 0.9f;
            var mat = StageBuilder.MatEmissive(new Color(1f, 0.85f, 0.5f), 1.6f);
            go.GetComponent<Renderer>().sharedMaterial = mat;
            var rb = go.AddComponent<Rigidbody>();
            rb.mass = 1f;
            rb.linearDamping = 0.6f;
            rb.angularDamping = 0.8f;
            rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
            go.AddComponent<PlayerController>();

            // 은은한 자기 조명
            var lightGo = new GameObject("glow");
            lightGo.transform.SetParent(go.transform);
            lightGo.transform.localPosition = Vector3.up * 0.5f;
            var l = lightGo.AddComponent<Light>();
            l.type = LightType.Point;
            l.range = 6f;
            l.intensity = 1.4f;
            l.color = new Color(1f, 0.9f, 0.6f);
            return go;
        }

        void Awake() { rb = GetComponent<Rigidbody>(); }

        void Update()
        {
            // 터치/마우스 드래그
            if (Input.GetMouseButtonDown(0))
            {
                dragging = true;
                dragStart = Input.mousePosition;
            }
            else if (Input.GetMouseButtonUp(0))
            {
                dragging = false;
                dragInput = Vector2.zero;
            }
            if (dragging)
            {
                Vector2 delta = (Vector2)Input.mousePosition - dragStart;
                float radius = Screen.height * 0.12f;
                dragInput = Vector2.ClampMagnitude(delta / radius, 1f);
            }
        }

        void FixedUpdate()
        {
            if (GameManager.I != null && !GameManager.I.Playing) return;

            float h = Input.GetAxisRaw("Horizontal");
            float v = Input.GetAxisRaw("Vertical");
            Vector2 keys = new Vector2(h, v);
            Vector2 input = keys.sqrMagnitude > 0.01f ? Vector2.ClampMagnitude(keys, 1f) : dragInput;

            var dir = new Vector3(input.x, 0, input.y);
            rb.AddForce(dir * force, ForceMode.Acceleration);

            var flat = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
            if (flat.magnitude > maxSpeed)
            {
                var capped = flat.normalized * maxSpeed;
                rb.linearVelocity = new Vector3(capped.x, rb.linearVelocity.y, capped.z);
            }
        }

        public void Teleport(Vector3 pos)
        {
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
            transform.position = pos;
        }
    }

    // 카메라: 구슬 뒤쪽 상단 추적 + 부드러운 감쇠
    public class CameraFollow : MonoBehaviour
    {
        public Transform target;
        readonly Vector3 offset = new Vector3(0, 7.5f, -8.5f);

        void LateUpdate()
        {
            if (target == null) return;
            var want = target.position + offset;
            transform.position = Vector3.Lerp(transform.position, want, 6f * Time.deltaTime);
            transform.LookAt(target.position + Vector3.forward * 2.2f);
        }
    }
}
