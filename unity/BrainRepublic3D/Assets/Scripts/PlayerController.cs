using UnityEngine;

namespace BrainRepublic
{
    // 요원 '스파크' 조작: 드래그(모바일/마우스) 또는 WASD/화살표.
    // 스킬(클리어 보상)은 GameManager가 해금 여부를 관리하고, 이 컴포넌트가 실행한다.
    public class PlayerController : MonoBehaviour
    {
        public float force = 22f;
        public float maxSpeed = 9f;

        public const float JumpVel = 7.5f;
        public const float DashVel = 13f;
        public const float DashCd = 3f;
        public const float ShieldCd = 8f;
        public const float FocusCd = 10f;
        public const float FocusDur = 2.5f;
        public const float MagnetCd = 10f;
        public const float MagnetDur = 5f;
        public const float MagnetRange = 7f;

        Rigidbody rb;
        Vector2 dragStart;
        bool dragging;
        Vector2 dragInput;

        // 스킬 상태 (남은 쿨다운/지속시간)
        public float dashCd, focusCd, magnetCd;
        public float shieldRecharge;       // 0이면 방패 준비됨
        public bool ShieldReady => shieldRecharge <= 0f;
        public float focusLeft, magnetLeft;

        public static GameObject Create(Vector3 pos)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            go.name = "Player";
            go.tag = "Player";
            go.transform.position = pos;
            go.transform.localScale = Vector3.one * 0.9f;
            go.GetComponent<Renderer>().sharedMaterial = StageBuilder.MatEmissive(new Color(0.55f, 0.95f, 1f), 2.2f);
            var rb = go.AddComponent<Rigidbody>();
            rb.mass = 1f;
            rb.linearDamping = 0.6f;
            rb.angularDamping = 0.8f;
            rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
            go.AddComponent<PlayerController>();

            // 홀로그램 트레일
            var trail = go.AddComponent<TrailRenderer>();
            trail.time = 0.45f;
            trail.startWidth = 0.5f;
            trail.endWidth = 0.02f;
            trail.material = StageBuilder.TrailMat();
            trail.startColor = new Color(0.55f, 0.95f, 1f, 0.65f);
            trail.endColor = new Color(0.55f, 0.95f, 1f, 0f);

            var lightGo = new GameObject("glow");
            lightGo.transform.SetParent(go.transform);
            lightGo.transform.localPosition = Vector3.up * 0.5f;
            var l = lightGo.AddComponent<Light>();
            l.type = LightType.Point;
            l.range = 7f;
            l.intensity = 1.6f;
            l.color = new Color(0.6f, 0.95f, 1f);
            return go;
        }

        void Awake() { rb = GetComponent<Rigidbody>(); }

        bool Grounded()
        {
            return Physics.Raycast(transform.position, Vector3.down, 0.62f);
        }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            dashCd = Mathf.Max(0, dashCd - dt);
            focusCd = Mathf.Max(0, focusCd - dt);
            magnetCd = Mathf.Max(0, magnetCd - dt);
            shieldRecharge = Mathf.Max(0, shieldRecharge - dt);
            magnetLeft = Mathf.Max(0, magnetLeft - dt);
            if (focusLeft > 0)
            {
                focusLeft -= dt;
                if (focusLeft <= 0) Time.timeScale = 1f;
            }

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

            // 키보드 스킬 단축키
            if (GameManager.I != null && GameManager.I.Playing)
            {
                if (Input.GetKeyDown(KeyCode.Space)) TryJump();
                if (Input.GetKeyDown(KeyCode.LeftShift) || Input.GetKeyDown(KeyCode.RightShift)) TryDash();
                if (Input.GetKeyDown(KeyCode.F)) TryFocus();
                if (Input.GetKeyDown(KeyCode.Q)) TryMagnet();
            }

            // 기억 자석: 주변 파편 끌어당기기
            if (magnetLeft > 0)
            {
                foreach (var c in Object.FindObjectsByType<Collectible>(FindObjectsSortMode.None))
                {
                    var d = transform.position - c.transform.position;
                    if (d.magnitude < MagnetRange)
                        c.transform.position += d.normalized * 8f * Time.deltaTime;
                }
            }
        }

        // ---- 스킬 실행 (해금 확인은 GameManager) ----

        public void TryJump()
        {
            if (!GameManager.I.HasSkill(Skill.Jump) || !Grounded()) return;
            var v = rb.linearVelocity;
            rb.linearVelocity = new Vector3(v.x, JumpVel, v.z);
            GameManager.I.OnSkillUsed(Skill.Jump);
        }

        public void TryDash()
        {
            if (!GameManager.I.HasSkill(Skill.Dash) || dashCd > 0) return;
            dashCd = DashCd;
            var flat = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
            var dir = flat.sqrMagnitude > 0.5f ? flat.normalized : Vector3.forward;
            rb.linearVelocity = dir * DashVel + Vector3.up * 1.5f;
            GameManager.I.OnSkillUsed(Skill.Dash);
        }

        // 수막 방패는 자동 발동: Hazard가 GameManager.TryShield로 조회
        public bool ConsumeShield()
        {
            if (shieldRecharge > 0) return false;
            shieldRecharge = ShieldCd;
            return true;
        }

        public void TryFocus()
        {
            if (!GameManager.I.HasSkill(Skill.Focus) || focusCd > 0) return;
            focusCd = FocusCd;
            focusLeft = FocusDur;
            Time.timeScale = 0.45f;
            GameManager.I.OnSkillUsed(Skill.Focus);
        }

        public void TryMagnet()
        {
            if (!GameManager.I.HasSkill(Skill.Magnet) || magnetCd > 0) return;
            magnetCd = MagnetCd;
            magnetLeft = MagnetDur;
            GameManager.I.OnSkillUsed(Skill.Magnet);
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
            Time.timeScale = 1f;
            focusLeft = 0;
        }
    }

    // 카메라: 구슬 뒤쪽 상단 추적
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
