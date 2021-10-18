# Contributing to http-server

> Please read these guidelines before submitting an issue, filing a feature request, or contributing code.

## :bug: I Found a Bug

Sorry! It happens to the best of us. If you've found a bug in http-server, **please [search](https://github.com/http-party/http-server/issues/) to see if it's already been reported**. Otherwise, create a [new issue](https://github.com/http-party/http-server/issues/new). If you can fix the bug yourself, feel free to create a [pull request](#propose-a-change) thereafter.

Please include _as much detail as possible_ to help us reproduce and diagnose the bug. Most importantly:

- Make use of the issue template!
- Let us know _how_ you're running http-server (options, flags, environment, etc.)
- Include your test code or file(s). If large, please provide a link to a repository or [gist](https://gist.github.com).
- Please show code in JavaScript only (any version)

If we need more information from you, we'll let you know. If you don't within a reasonable time frame (TBD), your issue will be automatically tagged as stale and eventually closed for inactivity.

## :exclamation: Propose a Change

Before you get your hands dirty, please [search](https://github.com/http-party/http-server/issues/) for a related issue, or [create a new one](https://github.com/http-party/http-server/issues/new). If you wish to contribute a new feature, this is doubly important! Let's discuss your proposed changes first; we don't want you to waste time implementing a change that is at odds with the project's direction. That said, we'll happily consider any contribution, no matter how great or small.

### :shoe: Contributing Code: Step-by-Step

Follow these steps to get going.

1. [Install the latest version of Node.js](https://nodejs.org/en/download).
    - If you're new to installing Node, a tool like [nvm](https://github.com/creationix/nvm#install-script) can help you manage multiple version installations.
1. Follow [Github's documentation](https://help.github.com/articles/fork-a-repo/) on setting up Git, forking and cloning.
1. Create a new branch in your fork, giving it a descriptive name
1. Execute `npm install` to install the prod and dev dependencies
   - Do not use `yarn install` for development, as it may not get the same package versions as other developers.
1. Make your changes and add them via `git add`.
   - **Tests are required** for any non-trivial code change. If you're having trouble making tests, go ahead and open the pull request and we can help
   - Keep your PR focused. Don't fix multiple things at once, and don't upgrade dependencies unless necessary.
1. Before committing, run `npm test`
   - Tests will also run on your PR, but running them locally will let you catch problems ahead-of-time.
1. Commit your changes.
   - See [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/).
   - **Please do not use "Conventional Commits" style**
1. Push your changes to your fork.
1. Now on [http-party/http-server](https://github.com/http-party/http-server), you should see a notification about your recent changes in your fork's branch, with a green button to create a pull request. Click the button.
1. Describe your changes in detail here, following the template. Once you're satisfied, submit the form.
1. Be patient while your PR is reviewed. This can take a while. We may request changes, but don't be afraid to question them.
1. Your PR might become conflicted with the code in `master`. If this is the case, you will need to [update your PR](#up-to-date) and resolve your conflicts.
1. You don't need to make a new PR to any needed changes. Instead, commit on top of your changes, and push these to your fork's branch. The PR will be updated, and CI will re-run.
   - **Please do not rebase and force-push**, it ruins the git history

## :angel: I Just Want To Help

_Excellent._ Here's how:

- **Handy with JavaScript?** Please check out the issues labeled [`help-wanted`](https://github.com/http-party/http-server/issues?q=is%3Aopen+is%3Aissue+label%3A%22help-wanted%22) or [`good first issue`](https://github.com/http-party/http-server/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Agood+first+issue). 
- **Wait--you write unit tests for _fun_?** A PR which increases coverage is unlikely to ever be turned down.
