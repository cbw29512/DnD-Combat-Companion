# Implementation status

## Verified
- Existing local V2.1 ZIP passes nine Node safety regression tests.
- GitHub repository initialized with CI and architecture documentation.

## Not yet verified in GitHub
- V2.1 source tree and tests are **not committed** yet.
- Browser end-to-end behavior, offline/iPhone install, import pipeline and Netlify deployment not validated.

## Next milestone
1. Commit the exact existing V2.1 source bundle plus tests. Do not replace working files with invented substitutes.
2. Run GitHub CI and inspect failures.
3. Add licensed 2014 and 2024 SRD importers with edition-specific mapping, provenance and explicit review-required flags.
4. Add replayable fixtures for complex multiattacks, save effects, hazards and damage typing.
5. Test first-visit online caching and offline reload on desktop and iPhone.
6. Release signed/tagged reproducible static site artifact.

## Definition of done for catalog expansion
Every card has a source and license, edition tag, deterministic validation tests, and zero guessed mechanics. Unsupported features remain visible as manual-only instructions.
