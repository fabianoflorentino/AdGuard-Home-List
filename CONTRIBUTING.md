# Contributing

Thanks for helping improve AdGuard Home List. Contributions of all sizes are
welcome: rules, upstream sources, bug reports, documentation and code.

## Ways to contribute

- **Allow a domain:** add an exception under `allowlist/custom/`.
- **Block a domain:** add a rule under `blocklist/custom/`.
- **Add an upstream source:** append its URL to the matching
  `allowlist/external/*.list` or `blocklist/external/*.list` file.
- **Fix a false positive:** open an issue with the domain and what broke.
- **Improve the CLI or website:** code and documentation changes are welcome.

## Adding rules

Use AdGuard filtering syntax:

```adblock
@@||example.com^$important   # allow
||ads.example.com^           # block
```

Keep one rule per line. Comments start with `#` or `!`. Rules are de-duplicated
and sorted automatically when the lists are generated.

## Adding upstream sources

Add one URL per line to the appropriate file:

```text
allowlist/external/allowlist.external.hosts.list
allowlist/external/allowlist.external.adguard.list
allowlist/external/allowlist.external.pihole.list
blocklist/external/blocklist.external.hosts.list
blocklist/external/blocklist.external.adguard.list
blocklist/external/blocklist.external.pihole.list
```

Prefer stable URLs and reputable projects. The weekly **Link check** workflow
will flag dead sources.

## Code changes

Requirements: **Node.js 22+**.

```sh
cd modules/cli
npm ci
npm run lint
npm run format:check
npm test
```

The CI workflow runs the same commands. Please include tests for behavior
changes.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make focused changes and update the documentation when needed.
3. Run the checks above.
4. Open a pull request using the provided template.

## Code of Conduct

By participating, you agree to follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

Do not open public issues for security problems. See [SECURITY.md](./SECURITY.md).
