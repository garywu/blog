# 2. Existing Solutions

## Built-in Git Tools

### Git Subtree

Git's built-in subtree functionality allows pushing subdirectories to other repositories.

```bash
# Add remote repository
git remote add blog-repo https://github.com/username/blog-repo.git

# Push subdirectory to remote
git subtree push --prefix=blog-posts blog-repo main
```

**Pros:**
- ✅ Built into Git (no additional tools needed)
- ✅ Maintains history and relationships
- ✅ Works with existing Git workflows

**Cons:**
- ❌ Requires adding remotes to current repo
- ❌ Can clutter `.git/config` with multiple remotes
- ❌ Complex syntax for simple operations
- ❌ History pollution in main repository

### Git Worktrees

For repositories with multiple branches representing different content types.

```bash
# Create worktree for blog branch
git worktree add ../blog-workspace blog-branch

# Work in separate directory
cd ../blog-workspace
# ... make changes ...
git commit && git push
```

**Pros:**
- ✅ Separate working directories
- ✅ Share Git history and configuration
- ✅ Built-in Git feature

**Cons:**
- ❌ Only works within same repository
- ❌ Requires branch-based organization
- ❌ Still requires directory management

## Command-Line Publishing Tools

### NPM-based Tools

**git-directory-deploy**
```bash
npm install -g git-directory-deploy
git-directory-deploy --directory dist --branch gh-pages --repo https://github.com/user/repo.git
```

**git-publish**
```bash
npm install -g git-publish
git-publish ./content username/blog-repo
```

**Pros:**
- ✅ Simple command-line interface
- ✅ Handles Git operations automatically
- ✅ Configurable options

**Cons:**
- ❌ Requires Node.js/npm installation
- ❌ Additional dependencies
- ❌ May not be maintained actively

### Rust/Go Tools

**git-deploy** (various implementations)
```bash
# Rust version
cargo install git-deploy
git-deploy ./src username/target-repo

# Go version  
go install github.com/user/git-deploy
git-deploy push ./docs user/docs-repo
```

**Pros:**
- ✅ Fast native binaries
- ✅ Single executable
- ✅ Cross-platform support

**Cons:**
- ❌ Need to install from source
- ❌ Different tool ecosystems
- ❌ Varying feature sets

## GitHub-Specific Solutions

### GitHub CLI

```bash
# Clone, modify, commit, push workflow
gh repo clone username/blog-repo /tmp/blog
cp -r ./my-post /tmp/blog/posts/
cd /tmp/blog
git add . && git commit -m "Add new post" && git push
cd - && rm -rf /tmp/blog
```

**Pros:**
- ✅ Official GitHub tooling
- ✅ Integrates with GitHub features
- ✅ Can create repos, PRs, etc.

**Cons:**
- ❌ GitHub-specific (not GitLab, Bitbucket, etc.)
- ❌ Requires manual workflow scripting
- ❌ No built-in publish command

### GitHub Actions

```yaml
# .github/workflows/publish-to-blog.yml
name: Publish to Blog
on:
  push:
    paths: ['blog-posts/**']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Publish to blog repo
        run: |
          # Custom publishing logic
```

**Pros:**
- ✅ Automated publishing
- ✅ Triggers on specific changes
- ✅ No local setup required

**Cons:**
- ❌ GitHub-specific
- ❌ Not interactive/immediate
- ❌ Requires workflow configuration

## IDE/Editor Solutions

### VS Code Multi-Root Workspaces

```json
{
  "folders": [
    {"path": "./current-project"},
    {"path": "../blog-repo"}
  ]
}
```

**Pros:**
- ✅ Both projects visible simultaneously
- ✅ Integrated Git operations
- ✅ Rich editing features

**Cons:**
- ❌ Requires workspace setup
- ❌ IDE-specific solution
- ❌ Heavy for simple publishing tasks

### Editor Plugins

Various plugins for Vim, Emacs, VS Code that add publishing commands.

**Pros:**
- ✅ Integrated into editing workflow
- ✅ Customizable keybindings
- ✅ Editor-specific optimizations

**Cons:**
- ❌ Editor-specific
- ❌ Requires plugin installation
- ❌ Limited to specific editors

## Analysis: Why Current Tools Fall Short

### Common Issues

1. **Setup Overhead**: Most tools require installation, configuration, or workspace setup
2. **Limited Scope**: Many are specific to certain platforms (GitHub), editors, or use cases
3. **Complexity**: Simple publishing tasks require complex command syntax
4. **State Management**: Tools either modify your current repo or require persistent configuration

### The Missing Piece

What's missing is a **lightweight, universal, setup-free** solution that:
- Works from any directory
- Requires no permanent configuration
- Handles common publishing patterns
- Is portable across projects and systems

## Evaluation Matrix

| Tool | Setup Required | Cross-Platform | Universal | Lightweight |
|------|---------------|----------------|-----------|-------------|
| Git Subtree | Remote config | ✅ | ✅ | ⚠️ |
| NPM Tools | npm install | ✅ | ✅ | ❌ |
| GitHub CLI | gh install | ✅ | ❌ | ⚠️ |
| Git Worktrees | Branch setup | ✅ | ❌ | ✅ |
| IDE Solutions | Workspace config | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Excellent
- ⚠️ Acceptable  
- ❌ Poor

In the next chapter, we'll explore lightweight approaches that address these limitations. 