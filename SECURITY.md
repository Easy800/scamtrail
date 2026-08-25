# Security

Do not file security issues on the public tracker.

Email the maintainers privately. Include a reproduction that does **not** attach real victim files.

If HMAC pepper, vault keys, or P2 material leak:

1. Rotate the affected key version.
2. Treat matching keys as compromised until rotated.
3. Audit `audit_events` for P1/P2 reads in the leak window.
4. Do not commit secrets to git to “fix” the leak.

Evidence Vault contents are not open-licensed. See LICENSE.
