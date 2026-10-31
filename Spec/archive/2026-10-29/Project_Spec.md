# Trab AI (Trabecular) — Master Project Description & Technical Specification

---

## 1. Executive Summary & Boilerplate Descriptions

### One-Sentence Pitch

**Trab AI (Trabecular)** is a GPU-accelerated, mesh-free biomechanical verification and closed-loop CAD remediation engine that lets medical device manufacturers and surgical planning labs stress-test custom implants across 1 or 1,000 patient anatomies in seconds rather than days of manual tetrahedral meshing.

### Short Project Description (100 Words — For Forms & Intros)

Trabecular automates biomechanical Finite Element Analysis (FEA) and design optimization for craniomaxillofacial (CMF) surgery, custom 3D-printed implants, and orthodontics. Today, verifying whether a patient-specific titanium plate or osteotomy cut will survive mastication loads requires hours of manual tetrahedral mesh repair in legacy tools like Materialise 3-matic and Ansys. Trabecular ingests segmented 3D anatomy, converts geometries into Implicit Signed Distance Fields (`OpenVDB`/`NanoVDB`) to eliminate the tetrahedral meshing step, and runs parallel GPU immersed finite element sweeps (`NVIDIA Warp`) in seconds. When a design fails stress or anatomical clearance thresholds, a closed-loop remediation engine automatically adjusts strut thickness and screw trajectories—guided by a real-time Voice AI Co-Pilot.

### Full Master Project Description (300 Words — For Investors, Co-Founders & Technical Audits)

Trabecular is a B2B computer-aided engineering (CAE) platform built to eliminate the primary bottleneck in personalized medical device engineering: translating complex 3D patient anatomy into verified biomechanical simulations. In craniomaxillofacial (CMF) reconstruction, orthopedics, and orthodontics, software workflows remain split between rapid geometric CAD tools (which ignore physics) and legacy Finite Element Analysis suites like Ansys and Materialise 3-matic (which require hours of skilled bioengineering labor per case to heal self-intersecting triangles and generate watertight tetrahedral meshes). Because manual per-case meshing does not scale, implant manufacturers struggle to verify complex out-of-envelope clinical reconstructions and cannot practically simulate hundreds of diverse anatomies to prove true "worst-case" boundary conditions for FDA 510(k) submissions.

Trabecular replaces legacy boundary-fitted tetrahedral meshing with a unified **Implicit Signed Distance Field (SDF) and GPU Immersed/Cut Finite Element architecture**. Segmented bone and tooth surfaces (ingested via FDA-cleared segmentation APIs like Relu or open-source `nnU-Net` models) are converted into sparse narrow-band SDF volumes (`OpenVDB`/`NanoVDB`). Complex spatial operations—such as synthesizing parametric 0.25 mm periodontal ligament shells, executing planar osteotomies, and inserting custom titanium fixation hardware—are executed as unconditionally stable algebraic level-set operations.

On the backend, Trabecular projects these multi-material SDFs onto adaptive octree grids in `NVIDIA Warp`, fanning out stochastic parameter sweeps across parallel serverless GPUs to account for uncalibrated CBCT bone stiffness and segmentation boundary tolerances. Rather than merely outputting a passive stress heatmap when an implant exceeds yield limits or violates nerve keep-out zones, Trabecular wraps its physics kernel inside a **Hybrid Closed-Loop CAD Remediation Engine**—combining analytical GPU shape gradients (`wp.Tape`) for continuous strut thickening with discrete agentic search for screw trajectory re-routing under a strict safety-factor policy. Delivered as an engineering verification tool with a hands-free **Voice AI Biomechanical Co-Pilot**, Trabecular generates convergence and credibility artifacts aligned with ASME V&V 40 to accelerate both custom case sign-off and virtual-cohort R&D.

---

## 2. Core Problem Statement & Market Reality

### 2.1 The Three Engineering Bottlenecks in MedTech Simulation

1. **The Tetrahedral Meshing Wall:** Human cancellous bone, 28 multi-rooted teeth, and thin titanium fixation plates have complex, high-genus topologies. Converting surface STLs into body-fitted tetrahedral meshes (`.msh`) in Materialise 3-matic or Ansys Simpleware routinely fails due to sliver elements, self-intersections, and element inversions.
2. **The "510(k) Worst-Case Envelope" Blind Spot:** For patient-matched devices, manufacturers do not run manual FEA on every routine clinical case; instead, they clear a parameterized design envelope with the FDA by testing a "worst-case" configuration. Because manual meshing takes hours per skull, R&D teams typically test only 3 to 5 guessed anatomies—leaving them vulnerable to FDA Additional Information (AI) holds when reviewers ask for proof that those 5 skulls represent the true mechanical worst case across age, bone density, and geometry.
3. **Passive Diagnostics vs. Actionable Remediation:** Legacy solvers only report that a plate or appliance failed ($e.g., \text{Von Mises stress } \sigma_{\text{vM}} \text{ exceeds yield}$). A human engineer must manually return to CAD, thicken the bridge, re-angle screws away from the inferior alveolar nerve, re-mesh from scratch, and re-solve. Also, during Virtual Surgical Planning (VSP) review calls, oral surgeons cannot interactively test hardware modifications on the fly because re-running physics takes hours.

---

## 3. Product Positioning & Regulatory Posture

### 3.1 Stage-1 Posture: B2B Engineering Design & Verification Tool

To generate immediate B2B revenue without a multi-year FDA De Novo or 510(k) clinical clearance delay on Day 1, Trabecular is architected and marketed strictly as a **Computer-Aided Engineering (CAE) Design & Verification Tool** sold to device manufacturers, VSP service bureaus, and CAD automation platforms:

* **Customer Owns the Clinical/Device Claim:** Trabecular operates inside the manufacturer’s existing ISO 13485 / FDA Quality Management System Regulation (QMSR, effective February 2026) design controls—the same regulatory bucket occupied by Ansys, Abaqus, and Simpleware.
* **Built to Support ASME V&V 40 Credibility Assessments:** While no software tool is "FDA-cleared" under ASME V&V 40 in isolation, Trabecular automatically generates the exact verification evidence manufacturers need to establish model credibility for their defined Context of Use (CoU):
1. **Code & Calculation Verification:** Automated mesh/grid-refinement convergence curves ($64^3 \rightarrow 128^3 \rightarrow 192^3$), linear solver residual logs, and analytical benchmark parity reports.
2. **Uncertainty Quantification (UQ) & Sensitivity Analysis:** Explicit propagation of bone modulus variance and segmentation surface tolerance bands.
3. **Independent Second-Solver Export:** One-click export of deformed geometries and volumetric Ansys/FEBio/CalculiX input decks (`.inp` / `.cdb`) so enterprise QA teams can spot-check Trabecular’s winning remediated CAD design inside their legacy solver of record.



---

## 4. End-to-End System Architecture Specification

Trabecular is architected as a decoupled 5-layer pipeline separating deterministic spatial registration, implicit field geometry, serverless GPU partial differential equation (PDE) solving, closed-loop CAD optimization, and real-time voice-guided visualization.

```
[1. Ingestion & Landmark Registration] ──► (Segmented STLs + Uncertainty Priors)
                  │
                  ▼
[2. Implicit SDF Geometry Engine (OpenVDB)] ──► (Multi-Material NanoVDB Volumes)
                  │
                  ▼
[3. Parallel Serverless GPU Solver (NVIDIA Warp)] ◄──┐ (Closed-Loop Iteration)
                  │                                   │
                  ▼                                   │
[4. Hybrid Autodiff + Agentic CAD Remediator] ────────┘
                  │
                  ▼ (Verified Mesh + ASME V&V 40 Telemetry)
[5. 3D Browser Viewport (R3F/VTK.js) + Bolna Voice AI VSP Co-Pilot]

```

### Layer 1: Anatomy Ingestion & Deterministic Spatial Registration

* **Multi-Source Segmentation Ingestion:** Accepts clean surface meshes (`.stl` / `.ply`) from FDA 510(k)-cleared commercial APIs (e.g., **Relu Engine**) or open-source clinical models (**DentalSegmentator** / `nnU-Net`).
* **Compartmental Bone Classification (Bypassing Uncalibrated CBCT HU):** Because dental CBCT voxel grey values do not map reliably to calibrated Hounsfield Units (HU), Trabecular does not map raw voxel intensities to Young’s Modulus. Instead, the anatomy is classified into discrete structural compartments—**Cortical Shell** vs. **Trabecular Core**—and assigned literature-validated stochastic modulus distributions ($E_{\text{cortical}} \in [12, 18]\text{ GPa}$, $E_{\text{trabecular}} \in [0.45, 1.85]\text{ GPa}$).
* **Segmentation Boundary Error Propagation:** Clinical CT/CBCT segmentation carries a surface accuracy tolerance of $\pm 0.2\text{ mm to } 0.5\text{ mm}$. Trabecular dilates anatomical keep-out zones (such as the inferior alveolar nerve canal and mental foramen) by an explicit safety buffer ($\Delta r_{\text{buffer}} = +1.5\text{ mm}$) before checking screw trajectories.
* **Anatomical Landmark Registration:** Uses Principal Component Analysis (PCA) bounding-box initialization followed by Iterative Closest Point (ICP) template registration (with a manual 3-click override in UI for severely deformed trauma/oncology defects) to locate condylar heads, gonion, zygomatic arch, and occlusal stops—snapping physiological muscle force vectors deterministically.

### Layer 2: Implicit Signed Distance Field (SDF) Geometry Engine

* **Core Stack:** `MeshLib (mrmeshpy)`, `OpenVDB`, and `NanoVDB`.
* **Eliminating Tetrahedral Meshing:** Every anatomical structure and hardware component is converted into a narrow-band Signed Distance Field $\phi(\mathbf{x})$, where $\phi(\mathbf{x}) \lt 0$ inside the volume, $\phi(\mathbf{x}) = 0$ on the boundary, and $\phi(\mathbf{x}) \gt 0$ outside.
* **Synthetic Parametric Tissue Offsets:** Features smaller than clinical CBCT voxel resolution—such as the 0.25 mm periodontal ligament (PDL)—are explicitly modeled as synthetic parametric level-set offset shells around reconstructed root surfaces:

$$\phi_{\text{PDL}}(\mathbf{x}) = \max\left(\phi_{\text{root}}(\mathbf{x}) - 0.25\text{ mm}, \, -\phi_{\text{root}}(\mathbf{x})\right)$$


* **Unconditionally Stable Boolean Surgery:** Osteotomy cuts (BSSO, Le Fort I, fibula free-flap resections), bone segment rigid-body transformations ($\mathbf{T} \in SE(3)$), and screw-hole subtractions are executed as voxel-wise `min`/`max` algebraic operations in $O(1)$ time per active voxel, guaranteeing zero self-intersecting polygons.

### Layer 3: Multi-Fidelity GPU Physics Solver

* **Core Stack:** `NVIDIA Warp (warp.fem)`, `Modal` Serverless GPU Infrastructure (NVIDIA A10G / L40S), `PyTorch`, and `SciPy`.
* **Two-Tier Solver Roadmap (MVP vs. Production):**
* **Phase 1 (7-Day MVP — Immersed Voxel/Octree FEM with Ersatz Stabilization):** Embeds the NanoVDB material domains into a structured 3D Hexahedral/Octree background grid (`wp.fem.Grid3D`). To prevent singular stiffness matrices ($\det(\mathbf{K}) = 0$) in empty or sliver-cut cells without requiring complex cut-cell quadrature, empty air cells receive an **Ersatz stiffness floor** ($E_{\text{void}} = 10^{-5} \times E_{\text{bone}}$). The linear elasticity system $\mathbf{K}\mathbf{u} = \mathbf{f}$ is assembled in Block Sparse Row (`wp.sparse.BsrMatrix`) format in `FP64` precision and solved via Jacobi-Preconditioned Conjugate Gradient (`wp.optim.linear.cg`).
* **Phase 2 (Production Target — Ghost-Penalty Stabilized CutFEM):** Adds sub-cell marching-cubes quadrature along the $\phi(\mathbf{x}) = 0$ zero level-set, Nitsche’s method for weak interface enforcement, and ghost-penalty stabilization across cut boundary faces.


* **Parallel Serverless Uncertainty Sweeps:** Instead of running sequential simulations on one GPU, Trabecular uses `Modal.map()` to fan out collocation runs (spanning 5th, 50th, and 95th percentile trabecular stiffness and muscle loading bounds) across parallel cloud GPUs simultaneously—returning a multi-run stress confidence envelope in the wall-clock time of a single solve (~2 to 6 seconds on warm containers).
* **Surface Stress Projection:** To eliminate voxel "staircase" artifacts visually and numerically, computed integration-point Cauchy stress tensors are smoothed across active material domains and trilinearly interpolated onto the vertices of the original high-resolution smooth `.stl` surface mesh.

### Layer 4: Closed-Loop Hybrid CAD Remediation Engine

When a simulation flags a mechanical or anatomical violation—such as peak Von Mises stress exceeding the safety-factor threshold ($\sigma_{\text{vM}} \gt \frac{\sigma_{\text{yield}}}{\text{SF}}$) or a screw trajectory breaching the dilated nerve canal keep-out zone—Trabecular triggers an automated remediation loop:

1. **Discrete Spatial Search (Agentic Orchestrator):** Handles discontinuous, topological decisions that gradients cannot cross—such as shifting a screw hole by $+3.0\text{ mm}$ along the mandibular border to clear the mental foramen or switching from a 4-hole to a 6-hole plate template.
2. **Continuous Parameter Optimization (`Warp` Differentiable Physics / Parallel Line Search):** Adjusts continuous CAD parameters (`strut_thickness_mm`, `bridge_height_mm`, `fillet_radius_mm`) using `wp.Tape` analytical sensitivity gradients or parallel GPU line-search evaluation.
3. **Conservative Safety-Factor Policy:** Because numerical optimizers naturally push designs right up against discretization error margins, the remediation objective enforces a mandatory **Safety Factor ($\text{SF} \ge 1.8$)** against titanium yield ($\sigma_{\text{yield}} = 880\text{ MPa} \implies \sigma_{\text{max\_allowed}} \le 488\text{ MPa}$) and cortical bone micro-strain limits ($\varepsilon \le 3,000\text{ }\mu\varepsilon$).

### Layer 5: Dual-Engine 3D Viewport & Bolna Voice AI VSP Co-Pilot

* **Frontend Stack:** `Next.js (App Router)`, `React Three Fiber (R3F)`, `VTK.js`, `Supabase Realtime`, and `Bolna Voice AI`.
* **Why Voice AI Belongs in the VSP Loop:** Oral surgeons do not operate FEA pre-processors; they review proposed surgical plans during 15-minute online calls with VSP biomedical engineers. Trabecular embeds a low-latency **Bolna Voice AI Co-Pilot** into the 3D browser workspace:
* **Synchronized Audio + 3D Camera Control:** When the Voice Co-Pilot reports a failure zone (*"The initial 1.5mm lower strut reaches 512 MPa, violating our 1.8x safety factor, and Screw #2 is 1.1mm from the mental foramen"*), its webhook pushes a real-time event via Supabase that smoothly animates the Three.js camera directly to the offending screw/strut coordinate.
* **Hands-Free Constraint Iteration:** The surgeon or engineer can verbally issue design constraints (*"Increase nerve clearance to 4mm and re-optimize the plate bridge"*), triggering the parallel GPU remediation loop and rendering a side-by-side **Original vs. Remediated CAD diff** for human sign-off.



---

## 5. Technical Specifications & Performance Budgets

| System Parameter | 7-Day Buildathon Prototype Target | Production B2B SaaS Target (90-Day Batch) |
| --- | --- | --- |
| **Grid Resolution & DOFs** | $96^3$ Cartesian Grid (~750k total DOFs; ~220k active bone/hardware DOFs) | $192^3$ to $256^3$ Adaptive Octree Grid (~2M–6M active DOFs) |
| **Peak GPU VRAM Footprint** | **~1.4 GB VRAM** (Fits on any 6 GB laptop RTX or 16 GB Cloud T4) | **~5.2 GB to 11.2 GB VRAM** (Runs on 24 GB NVIDIA A10G or 48 GB L40S) |
| **Warm GPU Solve Latency** | **1.8 – 3.0 seconds** per configuration (with `keep_warm=1` on Modal) | **6.0 – 12.0 seconds** (5-branch parallel GPU uncertainty sweep) |
| **Analytical Benchmark Error** | Less than **5% stress error** vs. Euler-Bernoulli cantilever beam theory | Less than **5% peak stress deviation** vs. body-fitted Ansys/FEBio Tet10 reference meshes across 5 clinical validation cases |
| **3D Browser Frame Rate** | **60+ FPS** (1.5 MB surface-interpolated `.glb` vertex-color buffer) | **60 FPS** (Surface mesh + chunked `.vti` internal cross-section slicer) |
| **Safety Factor Policy** | Hardcoded **$\text{SF} \ge 1.8$** against Ti-6Al-4V yield ($880\text{ MPa}$) | Configurable per-customer ISO/ASTM fatigue and yield envelopes + `.inp` Ansys verification deck export |

---

## 6. Commercial Go-To-Market & 4-Horizon Expansion Roadmap

To avoid getting trapped in a small single-niche market, Trabecular sequences its commercial rollout across four expanding horizons using the exact same underlying SDF + GPU physics kernel:

| Horizon | Target Customer Segment | Core Use Case & Value Proposition | Pricing & Revenue Model |
| --- | --- | --- | --- |
| **Horizon 1: Complex Reconstruction & AI CAD Partners (Months 1–6)** | Boutique VSP service bureaus, custom CMF/oncology implant labs, and AI CAD design startups (**Meticuly, CustoMED**) that automate implant geometry but lack automated FEA. | **Out-of-Envelope Per-Case Verification:** Replaces the manual 3-matic + Ansys meshing loop on complex mandibular, cranial, and trauma reconstructions. | **$75 – $200 per case API** or **$2,500/mo** lab seat subscription. |
| **Horizon 2: Virtual Cohort 510(k) Envelope R&D (Months 6–18)** | Enterprise orthopedic, spine, trauma, and CMF device manufacturers (**Stryker, KLS Martin, Zimmer Biomet, DePuy Synthes**). | **1,000-Skull Virtual Cohort Verification:** Runs a new implant family across hundreds of diverse virtual anatomies in 20 minutes to mathematically prove the true worst-case configuration for FDA 510(k) submissions. | **$50,000 – $150,000/yr** enterprise R&D platform license. |
| **Horizon 3: High-Volume Orthodontics & Dental Appliances (Months 12–24)** | In-office clear aligner platforms (**ArchForm**), MARPE/MSE expander labs, and prosthodontic CAD vendors. | **Staging & Attachment Optimization:** Uses synthetic 0.25 mm PDL shells to flag root-tipping moments and automatically adjust attachment geometry to reduce aligner refinement rates. | **$5 – $20 per case** high-volume headless API. |
| **Horizon 4: Calibrated Longitudinal Remodeling (Months 24+)** | Strategic OEM partnerships (following the **FEops $\rightarrow$ Materialise** De Novo blueprint). | **Clinical Outcome Prediction:** Calibrates multi-year trabecular bone remodeling models (Huiskes’ law) against contractual post-op follow-up scans to secure regulatory clearance as a clinical planning tool. | Clinical per-procedure reimbursement / OEM royalty. |

---

## 7. Competitive Landscape & Defensible Moat

### 7.1 Competitive Matrix

* **Legacy Desktop CAE (Materialise 3-matic + Ansys Simpleware):** Industry gold standard for credibility, but chained to manual boundary-fitted tetrahedral meshing ($15,000–$40,000/yr desktop licenses requiring dedicated bioengineers). Cannot run zero-click 500-patient virtual cohorts or closed-loop voice remediation.
* **Automated Implant CAD Startups (Meticuly, CustoMED):** Automate the *geometric* drawing of surgical guides and plates using AI/templates, but do not own a mesh-free GPU biomechanical solver—making them prime API integration customers for Trabecular.
* **Early Point-Solution FEA (SimQ VIT / SimQ Dental):** Wraps traditional tetrahedral meshing in a cloud wizard for single-case Day-1 stress checks, but lacks mesh-free SDF scalability, closed-loop CAD auto-remediation, and virtual cohort envelope tooling.
* **Segmentation Providers (Relu AI, Diagnocat):** Upstream computer-vision suppliers that output hollow surface STLs with zero physics. Trabecular consumes Relu STLs alongside open-source `nnU-Net` models to avoid single-supplier lock-in.

### 7.2 Why Trabecular Is Defensible (Beyond Open-Source Libraries)

While `NVIDIA Warp` and `OpenVDB` are open-source primitives, Trabecular’s long-term defensibility compounds across three proprietary layers:

1. **The ASME V&V 40 Validation & Benchmark Evidence Library:** Medical device QA teams do not buy raw code; they buy pre-validated Context-of-Use (CoU) benchmark packages proving convergence parity against Ansys and physical ASTM fatigue tests. Once Trabecular’s validation package is written into a manufacturer's FDA QMSR design history file, switching costs are massive.
2. **Pre-Parameterized Virtual Anatomy Cohorts:** A curated, statistically stratified library of 1,000+ multi-compartment SDF anatomies (spanning cortical/trabecular stiffness bounds, age, sex, and defect geometries) ready for one-click 510(k) envelope testing.
3. **Closed-Loop Design-to-Physics Telemetry:** Every optimization cycle trains internal surrogate priors that predict optimal initial screw trajectories and strut dimensions before the first full-grid GPU solve even starts.