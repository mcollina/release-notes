#!/usr/bin/env node
import { Octokit } from '@octokit/core'
import { parseArgs } from 'node:util'
import { readFile } from 'node:fs/promises'

/* eslint camelcase:off */

let defaultOwner = ''
let defaultRepo = ''
let defaultVersion = ''
try {
  // read package.json
  const pkg = JSON.parse(await readFile('package.json', 'utf8'))
  /* regexp to extract owner and repo from github url */
  const regexp = /github\.com\/([^/]+)\/([^/.]+)(\.git)?/
  const [base, owner, repo] = regexp.exec(pkg.repository.url)
  defaultOwner = owner
  defaultRepo = repo
  defaultVersion = pkg.version
} catch {}

const options = {
  owner: {
    type: 'string',
    default: defaultOwner,
    short: 'o'
  },
  auth: {
    type: 'string',
    default: process.env.RELEASE_NOTES_TOKEN || process.env.GITHUB_TOKEN,
    short: 'a'
  },
  repo: {
    default: defaultRepo,
    type: 'string',
    short: 'r'
  },
  tag_name: {
    type: 'string',
    default: defaultVersion,
    short: 't'
  },
  target_commitish: {
    type: 'string',
    short: 'c',
    default: 'main'
  }
}

const {
  values: { owner, auth, repo, tag_name, target_commitish }
} = parseArgs({ options, strict: true })

if (!owner) {
  throw new Error('owner is required')
}

if (!repo) {
  throw new Error('repo is required')
}

if (!auth) {
  throw new Error('auth is required')
}

if (!tag_name) {
  throw new Error('tag_name is required')
}

console.log('Creating release', tag_name, 'for', owner, repo)

const octokit = new Octokit({ auth })

const { data: releases } = await octokit.request('GET /repos/{owner}/{repo}/releases', {
  owner,
  repo,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})

const { data: { name, body } } = await octokit.request('POST /repos/{owner}/{repo}/releases/generate-notes', {
  owner,
  repo,
  tag_name,
  target_commitish,
  previous_tag_name: releases[0]?.tag_name,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})

const { data: { html_url } } = await octokit.request('POST /repos/{owner}/{repo}/releases', {
  owner,
  repo,
  tag_name,
  target_commitish,
  name,
  body,
  draft: false,
  prerelease: false,
  generate_release_notes: false,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})

console.log('Release created at', html_url)
// console.log(JSON.stringify(res, null, 2))
