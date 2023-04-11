#!/usr/bin/env node
import { Octokit } from '@octokit/core'
import { parseArgs } from 'node:util'

/* eslint camelcase:off */

const options = {
  owner: {
    type: 'string',
    short: 'o'
  },
  auth: {
    type: 'string',
    short: 'a'
  },
  repo: {
    type: 'string',
    short: 'r'
  },
  tag_name: {
    type: 'string',
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
