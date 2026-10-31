# Modal access and local-compute decision

Verified October 31, 2026 (Asia/Calcutta). No payment details added or changed.

- Starter advertises $30/month included compute: [pricing](https://modal.com/pricing). This is not proof that an unverified account can consume all $30.
- [GPU documentation](https://modal.com/docs/guide/gpu) explicitly requires a valid payment method. The account rejected A10 GPU function creation with `Please add a payment method to use A10G GPU functions.` Therefore usable GPU compute before payment verification is zero.
- [Billing documentation](https://modal.com/docs/guide/billing) says a payment method must be on file to use Modal. A prior CPU attempt nevertheless reached remote numerical execution, then failed during Warp compilation with a float64/float32 type mismatch. No successful physics result was produced.
- The reviewed official pages publish no universal dollar allowance for CPU use without payment verification. Do not assert a $1 or $30 usable unverified-account budget. [Budget documentation](https://modal.com/docs/guide/budgets) says the maximum workspace budget depends on prior successful charges. The account's exact unverified CPU ceiling remains unconfirmed.
- Read-only October billing summary after these attempts: metered cost **$0.01002013**, billed cost **$0**, compute-credit adjustment **-$0.01000000**, free network allowance **-$0.00002013**. Metering may lag. This summary measures usage; it does not establish remaining credit eligibility or a verified spending cap.

Owner instruction: switch to local compute if Modal cannot be used without payment verification. Both cloud routes are now disabled locally, including the standalone implicit worker entry point. Credentials are retained privately for later. The implicit experiment UI defaults to local compute and offers no cloud selection. Local device is `cuda:0` (RTX 3050 Laptop, 4 GB); host RAM remains a separate constraint. No automatic cloud fallback.

Verification: four cloud-policy tests pass, including proof that disabled CPU/GPU routes cannot reserve budget or enter their Modal app contexts. Frontend TypeScript check passes. Configuration reports `cloud_enabled=false` and `compute_device=cuda:0`. Read-only Modal app listing returned an empty list after the prior attempts. No additional cloud execution was launched to test limits.

The new immersed specimen remains experimental. Its local API wiring, compiler correction, numerical checks and full-anatomy formulation are outstanding; selecting local compute does not qualify those calculations. Existing tetrahedral evidence remains a separately named reference/checker.
