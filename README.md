# AdGuard Home - List

[![AllowList](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/fabianoflorentino/AdGuard-Home-List/gh-pages/badge-allow.json&style=for-the-badge&logo=firefox&label=allowlist)](https://fabianoflorentino.github.io/AdGuard-Home-List/)
[![BlockList](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/fabianoflorentino/AdGuard-Home-List/gh-pages/badge-block.json&style=for-the-badge&logo=AdBlock&label=blocklist)](https://fabianoflorentino.github.io/AdGuard-Home-List/)
[![License](https://img.shields.io/github/license/fabianoflorentino/AdGuard-Home-List?style=for-the-badge)](./LICENSE.txt)

An **open source, community-friendly** collection of carefully curated **allowlist** and **blocklist** rules for [AdGuard Home](https://adguard.com/adguard-home/overview.html). Multiple external sources are downloaded, cleaned, de-duplicated and consolidated into single ready-to-use lists, regenerated **every day at 4 AM UTC**.

> Built with a focus on the allowlist: the goal is to keep legitimate services, CDNs, payment providers, game platforms and everyday tools working while still blocking ads, trackers and malicious domains.

- Website: <https://fabianoflorentino.github.io/AdGuard-Home-List/>
- Repository: <https://github.com/fabianoflorentino/AdGuard-Home-List>
- Issues: <https://github.com/fabianoflorentino/AdGuard-Home-List/issues>

## Table of contents

- [Quick start](#quick-start)
- [GitHub Pages](#github-pages)
- [How it works](#how-it-works)
- [Repository layout](#repository-layout)
- [Customizing the lists](#customizing-the-lists)
- [External list providers](#external-list-providers)
- [Local development](#local-development)
- [Fork and deploy your own](#fork-and-deploy-your-own)
- [Sources](#sources)
- [Contributing](#contributing)
- [License and credits](#license-and-credits)

## Quick start

Once you have AdGuard Home ready and are logged in, open **Filters → DNS allowlists** and add:

```sh
# AllowList (recommended)
https://raw.githubusercontent.com/fabianoflorentino/AdGuard-Home-List/gh-pages/AdGuard-Home-List.Allow.txt
```

A blocklist is also generated if you want to use it:

```sh
# BlockList (optional)
https://raw.githubusercontent.com/fabianoflorentino/AdGuard-Home-List/gh-pages/AdGuard-Home-List.Block.txt
```

Both URLs are stable and updated automatically every day. Point AdGuard Home at the raw URL and it will refresh the list on its own.

## GitHub Pages

The project has a cyberpunk/matrix-themed GitHub Pages site with usage instructions, live list counters and copy-to-clipboard links:

<https://fabianoflorentino.github.io/AdGuard-Home-List/>

The site is generated from the [`site/`](./site) directory and deployed to the `gh-pages` branch together with the generated lists by [`.github/workflows/publish.yml`](./.github/workflows/publish.yml).

## How it works

1. Custom rules from `allowlist/custom` and `blocklist/custom` are loaded.
2. External lists listed in `*.external.*.list` files are downloaded.
3. Rules are normalized to AdGuard syntax, filtered and de-duplicated.
4. The final lists, debug variants and JSON badges are written to `public/`.
5. The `publish` workflow deploys everything to the `gh-pages` branch.

The source branch is **`main`**. The generated output lives in **`gh-pages`**, which is what GitHub Pages and the raw URLs serve.

## Repository layout

```text
allowlist/
├── custom/            # Hand-curated allow rules
│   ├── cdn/
│   ├── dns/
│   ├── government/
│   ├── services/
│   └── url-shorteners.txt
├── external/          # URLs of external allow lists (adguard / hosts / pihole)
└── concat/            # URLs of raw AdGuard rule lists

blocklist/
├── custom/            # Hand-curated block rules
├── external/          # URLs of external block lists
└── concat/            # URLs of raw AdGuard rule lists

modules/cli/           # TypeScript CLI that generates the lists
site/                  # Static GitHub Pages website
.github/workflows/     # CI: tests + daily publish to gh-pages
```

The external providers are configured in files named `{TYPE}.external.{FORMAT}.list`. Each line is a URL that will be downloaded and combined during the release.

## Customizing the lists

Add your own domains directly to a file under `allowlist/custom/` or `blocklist/custom/`:

```adblock
@@||example.com^$important
```

External sources are added by appending their URL to the matching `*.list` file:

```text
allowlist/external/allowlist.external.hosts.list
allowlist/external/allowlist.external.adguard.list
allowlist/external/allowlist.external.pihole.list
```

Commit to `main`, and the next scheduled (or manually triggered) workflow run publishes the updated lists.

## External list providers

The `*.list` files contain the URLs of external lists. These lists are downloaded, cleaned and combined during a release.

### Contains

#### Services

- [AdGuardSDNSFilter/Filters](https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt)
- [AdguardTeam/cname-trackers](https://github.com/AdguardTeam/cname-trackers)
- [Adaway](https://adaway.org)
- [Yoyo.org](https://pgl.yoyo.org/adservers/)
- [firebog.net](https://firebog.net)
- [disconnect.me](https://disconnect.me)
- [phishing.army](https://phishing.army)

#### Community

- [StevenBlack/hosts](https://github.com/StevenBlack/hosts)
- [crazy-max/WindowsSpyBlocker](https://github.com/crazy-max/WindowsSpyBlocker) (Spy lists only)
- [blocklistproject/Lists](https://github.com/blocklistproject/Lists)
- [anudeepND/blacklist](https://github.com/anudeepND/blacklist)
- [Phishing-Database/Phishing.Database](https://github.com/Phishing-Database/Phishing.Database)
- [FadeMind/hosts.extras](https://github.com/FadeMind/hosts.extras)
- [Yhonay/antipopads](https://github.com/Yhonay/antipopads)
- [Spam404/lists](https://github.com/Spam404/lists)
- [Perflyst/PiHoleBlocklist](https://github.com/Perflyst/PiHoleBlocklist)
- [Dogino/Discord-Phishing-URLs](https://github.com/Dogino/Discord-Phishing-URLs)

#### AllowList

- [hl2guide/AdGuard-Home-Whitelist](https://github.com/hl2guide/AdGuard-Home-Whitelist) (Selected lists)
- [GoodnessJSON/PiHole-Whitelist](https://github.com/GoodnessJSON/PiHole-Whitelist)

## Local development

Requirements: **Node.js 22+**.

```sh
# Build the CLI
cd modules/cli
npm ci
npm run build
cd ../..
```

Generate the allowlist and blocklist locally (from the repository root):

```sh
node ./modules/cli/dist/main.js generate \
  --name AdGuard-Home-List.Allow.txt \
  --badge badge-allow.json \
  --external ./allowlist/external \
  --custom ./allowlist/custom \
  --concatExternal ./allowlist/concat \
  --convertToAllow true \
  --output ./dist

node ./modules/cli/dist/main.js generate \
  --name AdGuard-Home-List.Block.txt \
  --badge badge-block.json \
  --external ./blocklist/external \
  --custom ./blocklist/custom \
  --concatExternal ./blocklist/concat \
  --output ./dist
```

Preview the website locally (after copying the generated badges into `site/`, if desired):

```sh
python3 -m http.server 8080 --directory site
```

Then open <http://localhost:8080>.

## Fork and deploy your own

This project is fully open source, so anyone can run a private or public copy.

1. Fork this repository.
2. Rename your fork's default branch to `main` (Settings → Branches) if needed.
3. Enable GitHub Pages: **Settings → Pages → Source: Deploy from a branch → Branch: `gh-pages` / `(root)`**.
4. Go to **Actions** and run the **Publish** workflow, or push a commit to `main`.
5. Your lists will be available at:

```text
https://raw.githubusercontent.com/<your-user>/<your-repo>/gh-pages/AdGuard-Home-List.Allow.txt
https://raw.githubusercontent.com/<your-user>/<your-repo>/gh-pages/AdGuard-Home-List.Block.txt
```

The workflow needs `contents: write` permission (already configured) to publish to `gh-pages`.

## Sources

See [External list providers](#external-list-providers) for the full list of upstream projects. All credit for the upstream data belongs to their respective authors.

## Contributing

Contributions are welcome — new allow rules, false-positive fixes, new upstream sources and website improvements. Please open an issue or a pull request. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License and credits

- Licensed under the **GNU General Public License v3.0** — see [LICENSE.txt](./LICENSE.txt).
- Originally inspired by and forked from [Ealenn/AdGuard-Home-List](https://github.com/Ealenn/AdGuard-Home-List). Thanks to the original author and all upstream list maintainers.
