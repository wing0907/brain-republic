using UnityEngine;

namespace BrainRepublic
{
    // 스테이지 프로시저럴 조립기.
    // StageDef 좌표 규약: Vector3(x = 좌우 위치, y = 코스 진행거리 z, z = 폭/보조값)
    // 코스는 +z 방향으로 이어지는 평탄한 협곡길. 세그먼트 길이를 겹치게 잡아
    // 점프 없이 연속 주행이 가능하다 (떨어지면 체크포인트 리스폰).
    public static class StageBuilder
    {
        public const float SegLen = 14f;

        public static GameObject Build(StageDef def, out Vector3[] checkpoints)
        {
            var root = new GameObject("Stage_" + def.id);

            // 분위기
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = def.fog;
            RenderSettings.fogDensity = def.fogDensity;
            RenderSettings.ambientLight = Color.Lerp(def.fog, Color.white, 0.35f);

            var ground = MatSolid(Color.Lerp(def.theme, Color.black, 0.55f));
            var groundEdge = MatEmissive(def.theme, 0.9f);
            var ice = def.friction < 1f;

            checkpoints = new Vector3[def.platforms.Length];
            for (int i = 0; i < def.platforms.Length; i++)
            {
                var p = def.platforms[i];
                float x = p.x, z = p.y, width = Mathf.Max(3f, p.z);
                // 세그먼트마다 높이를 2cm씩 어긋나게 — 겹친 면의 Z-파이팅(화면 깨짐) 방지
                float segY = -0.5f - i * 0.02f;
                float topY = segY + 0.5f;
                var seg = GameObject.CreatePrimitive(PrimitiveType.Cube);
                seg.name = "seg" + i;
                seg.transform.SetParent(root.transform);
                seg.transform.position = new Vector3(x, segY, z);
                seg.transform.localScale = new Vector3(width, 1f, SegLen);
                seg.GetComponent<Renderer>().sharedMaterial = ground;
                if (ice)
                {
                    var pm = new PhysicsMaterial("ice") { dynamicFriction = def.friction, staticFriction = def.friction, frictionCombine = PhysicsMaterialCombine.Minimum };
                    seg.GetComponent<Collider>().material = pm;
                }
                // 가장자리 발광 레일 = 실제 벽 (콜라이더 유지 — 구슬이 뚫고 나가지 않게)
                foreach (var side in new[] { -1f, 1f })
                {
                    var rail = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    rail.name = "rail";
                    rail.transform.SetParent(seg.transform.parent);
                    rail.transform.position = new Vector3(x + side * (width / 2f + 0.18f), topY + 0.25f, z);
                    rail.transform.localScale = new Vector3(0.35f, 1.4f, SegLen);
                    rail.GetComponent<Renderer>().sharedMaterial = groundEdge;
                }
                checkpoints[i] = new Vector3(x, topY + 1.2f, z - SegLen / 2f + 1.5f);
            }

            // 기억 조각
            var crystalMat = MatEmissive(new Color(1f, 0.92f, 0.55f), 2.2f);
            foreach (var c in def.crystals)
            {
                var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                go.name = "crystal";
                go.transform.SetParent(root.transform);
                go.transform.position = new Vector3(c.x, 0.7f, c.y);
                go.transform.localScale = Vector3.one * 0.7f;
                go.GetComponent<Renderer>().sharedMaterial = crystalMat;
                go.GetComponent<Collider>().isTrigger = true;
                go.AddComponent<Collectible>();
            }

            // 장애물
            int wordIdx = 0;
            foreach (var ob in def.obstacles)
            {
                switch (ob.kind)
                {
                    case ObKind.Spike:
                        {
                            var s = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                            s.name = "spike";
                            s.transform.SetParent(root.transform);
                            s.transform.position = new Vector3(ob.pos.x, 0.55f, ob.pos.y);
                            s.transform.localScale = new Vector3(0.8f, 0.55f, 0.8f);
                            s.GetComponent<Renderer>().sharedMaterial = MatEmissive(new Color(1f, 0.2f, 0.25f), 1.8f);
                            s.GetComponent<Collider>().isTrigger = true;
                            s.AddComponent<Hazard>();
                            break;
                        }
                    case ObKind.MovingBlock:
                        {
                            var b = GameObject.CreatePrimitive(PrimitiveType.Cube);
                            b.name = "mover";
                            b.transform.SetParent(root.transform);
                            b.transform.position = new Vector3(ob.pos.x, 0.6f, ob.pos.y);
                            b.transform.localScale = ob.size;
                            b.GetComponent<Renderer>().sharedMaterial = MatEmissive(new Color(1f, 0.35f, 0.3f), 1.2f);
                            b.GetComponent<Collider>().isTrigger = true;
                            b.AddComponent<Hazard>();
                            var mv = b.AddComponent<MovingPlatform>();
                            mv.axis = ob.moveAxis;
                            mv.speed = ob.speed;
                            break;
                        }
                    case ObKind.SlowZone:
                        {
                            var zGo = GameObject.CreatePrimitive(PrimitiveType.Cube);
                            zGo.name = "slow";
                            zGo.transform.SetParent(root.transform);
                            zGo.transform.position = new Vector3(ob.pos.x, 0.15f, ob.pos.y);
                            zGo.transform.localScale = ob.size;
                            var m = MatSolid(new Color(0.3f, 0.9f, 0.9f, 0.4f));
                            SetTransparent(m);
                            zGo.GetComponent<Renderer>().sharedMaterial = m;
                            zGo.GetComponent<Collider>().isTrigger = true;
                            zGo.AddComponent<SlowZone>();
                            break;
                        }
                    case ObKind.WordGate:
                        {
                            var pair = StageDefs.WordPairs[(wordIdx + (int)ob.speed) % StageDefs.WordPairs.Length];
                            wordIdx++;
                            WordGate.Create(root.transform, ob.pos.y, pair[0], pair[1], def.theme);
                            break;
                        }
                }
            }

            // 도착 게이트
            var gate = GameObject.CreatePrimitive(PrimitiveType.Cube);
            gate.name = "gate";
            gate.transform.SetParent(root.transform);
            gate.transform.position = new Vector3(def.gatePos.x, 1.6f, def.gatePos.y);
            gate.transform.localScale = new Vector3(3.2f, 3.2f, 0.5f);
            gate.GetComponent<Renderer>().sharedMaterial = MatEmissive(def.theme, 2.5f);
            gate.GetComponent<Collider>().isTrigger = true;
            gate.AddComponent<Gate>();

            return root;
        }

        // ---- 머티리얼 유틸 (전량 코드 생성 — 외부 에셋 0) ----

        public static Material MatSolid(Color c)
        {
            var m = new Material(Shader.Find("Standard"));
            m.color = c;
            return m;
        }

        public static Material MatEmissive(Color c, float intensity)
        {
            var m = new Material(Shader.Find("Standard"));
            m.color = c;
            m.EnableKeyword("_EMISSION");
            m.SetColor("_EmissionColor", c * intensity);
            return m;
        }

        static void SetTransparent(Material m)
        {
            m.SetFloat("_Mode", 3);
            m.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            m.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            m.SetInt("_ZWrite", 0);
            m.EnableKeyword("_ALPHABLEND_ON");
            m.renderQueue = 3000;
        }
    }
}
