# Recorded and static placeholder protocol

> English summary: No recording is bundled. This protocol prevents placeholders
> from being presented as real recordings and defines the review needed before
> one can be registered.

## Current state

`demo/recording-manifest.json` is `not-recorded`. No filename, duration, speaker,
participant, thumbnail, or checksum is fabricated. UI and runbooks must say
**recorded fallback unavailable** until the manifest changes through human review.

## Registering a real recording

1. Confirm every visible asset is `demo-safe` and redistribution is permitted.
2. Confirm no account, token, notification, participant identity, or private
   repository material outside the allowlist is visible.
3. Store the approved file outside the demo repository unless its rights permit
   inclusion.
4. Record the real filename, SHA-256, duration, capture date, rights decision,
   and reviewer-provided approval reference.
5. Change status only after the file and checksum have both been verified.

## Static fallback

Static fallback means the built local site plus committed JSON snapshots. It is
not a screenshot or recording. A screenshot may be reported only if a real file
was produced during validation; do not create a placeholder image.
