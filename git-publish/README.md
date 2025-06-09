# Lightweight Git Publishing: Deploy Content to Any Repository

## The Developer's Publishing Dilemma

You're deep in your current project—code flowing, dotfiles configured, workspace dialed in. Then you have an idea for a blog post *about what you're building*. The workflow friction hits immediately: switch contexts, clone your blog repo, set up a separate workspace, lose momentum.

What if you could write that blog post right here, in your current project, and publish it anywhere without the context switch?

The lightweight git publishing challenge: **deploying content from your current repository to any other repository without permanent setup or heavy tooling**.

---

## Context-Switching Kills Creativity

Looking at traditional publishing workflows, a pattern emerges: artificial boundaries everywhere.

- **Separate repositories** require context switching and momentum loss
- **Submodules and subtrees** create permanent coupling between unrelated projects  
- **CI/CD pipelines** are overkill for simple content publishing
- **Manual copy-paste** breaks automation and creates maintenance debt

Notice how this isn't just a technical challenge—it's cognitive. When you're in flow on a project, spending 20 minutes setting up a publishing pipeline kills the creative momentum that made you want to share in the first place.

What's needed: temporary deployment strategies that work immediately and clean up after themselves.

## Existing Solutions: The Landscape

### Git Subtree (Built-in Solution)
```bash
# One-time setup
git subtree add --prefix=blog https://github.com/user/blog.git main --squash

# Publishing updates  
git subtree push --prefix=blog https://github.com/user/blog.git main
```

**Pros**: Native Git command, preserves history  
**Cons**: Permanent directory structure, complex conflict resolution

### Git Worktree (Separate Working Directory)
```bash
# Create linked working directory
git worktree add ../blog-workspace https://github.com/user/blog.git

# Work in separate directory
cd ../blog-workspace
# ... make changes ...
git push origin main
```

**Pros**: Complete isolation, full Git functionality  
**Cons**: Still requires context switch, directory management

### GitHub CLI (Modern Approach)
```bash
# Clone, modify, push in one command
gh repo clone user/blog /tmp/blog-temp && \
cd /tmp/blog-temp && \
cp -r /original/project/blog-content . && \
git add . && git commit -m "Update from project" && \
git push origin main && \
cd - && rm -rf /tmp/blog-temp
```

**Pros**: Scriptable, temporary by design  
**Cons**: Requires GitHub CLI, manual cleanup

## Lightweight Approaches: Immediate Solutions

### Approach 1: Temporary Clone Publishing
```bash
#!/bin/bash
# publish-content.sh - Zero-setup content publishing

TEMP_DIR=$(mktemp -d)
BLOG_REPO="git@github.com:user/blog.git"
SOURCE_DIR="./blog-content"

echo "📦 Cloning blog repository..."
git clone "$BLOG_REPO" "$TEMP_DIR"

echo "📝 Copying content..."
cp -r "$SOURCE_DIR"/* "$TEMP_DIR/"

echo "🚀 Publishing..."
cd "$TEMP_DIR"
git add .
git commit -m "Update from $(basename $(pwd))"
git push origin main

echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Published to $BLOG_REPO"
```

**Usage**: `./publish-content.sh`  
**Result**: Your content is published, no permanent setup required

### Approach 2: One-Command Publishing Function
```bash
# Add to your .bashrc/.zshrc/.config/fish/config.fish
function git-publish() {
    set -l repo $argv[1]
    set -l source_dir $argv[2]
    set -l temp_dir (mktemp -d)
    
    echo "🔄 Publishing $source_dir to $repo..."
    
    git clone $repo $temp_dir
    cp -r $source_dir/* $temp_dir/
    
    cd $temp_dir
    git add .
    git commit -m "Update from $(basename (pwd))"
    git push origin main
    
    cd -
    rm -rf $temp_dir
    
    echo "✅ Content published successfully"
}

# Usage examples:
# git-publish git@github.com:user/blog.git ./docs
# git-publish https://github.com/user/portfolio.git ./projects
```

### Approach 3: GitHub CLI Scripted Publishing
```bash
#!/bin/bash
# gh-publish.sh - GitHub CLI powered publishing

REPO_OWNER="user"
REPO_NAME="blog"  
SOURCE_DIR="./content"
BRANCH="main"

# Create temporary directory
TEMP_DIR=$(mktemp -d)

echo "📦 Cloning with GitHub CLI..."
gh repo clone "$REPO_OWNER/$REPO_NAME" "$TEMP_DIR"

echo "📝 Syncing content..."
rsync -av --delete "$SOURCE_DIR/" "$TEMP_DIR/"

echo "🚀 Publishing changes..."
cd "$TEMP_DIR"
git add .
if git diff --staged --quiet; then
    echo "ℹ️ No changes to publish"
else
    git commit -m "Update content from $(date '+%Y-%m-%d %H:%M')"
    git push origin "$BRANCH"
    echo "✅ Content published successfully"
fi

echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"
```

## Custom Scripts & Functions: Reusable Automation

### Advanced Publishing Script with Error Handling
```bash
#!/bin/bash
# robust-publish.sh - Production-ready content publishing

set -euo pipefail  # Exit on errors, undefined vars, pipe failures

# Configuration
REPO_URL="${REPO_URL:-}"
SOURCE_DIR="${SOURCE_DIR:-./content}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Auto-update from $(basename $(pwd))}"
BRANCH="${BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Validate inputs
validate_inputs() {
    [[ -z "$REPO_URL" ]] && error "REPO_URL must be set"
    [[ ! -d "$SOURCE_DIR" ]] && error "Source directory '$SOURCE_DIR' does not exist"
    
    # Check if git is available
    command -v git >/dev/null 2>&1 || error "Git is not installed"
    
    # Validate repo URL format
    if [[ ! "$REPO_URL" =~ ^(https://|git@) ]]; then
        error "Invalid repository URL format"
    fi
}

# Main publishing function
publish_content() {
    local temp_dir
    temp_dir=$(mktemp -d)
    
    # Cleanup function
    cleanup() {
        [[ -d "$temp_dir" ]] && rm -rf "$temp_dir"
    }
    trap cleanup EXIT
    
    log "Cloning repository..."
    if ! git clone --depth 1 "$REPO_URL" "$temp_dir" 2>/dev/null; then
        error "Failed to clone repository. Check URL and permissions."
    fi
    
    log "Syncing content from $SOURCE_DIR..."
    if ! cp -r "$SOURCE_DIR"/* "$temp_dir/" 2>/dev/null; then
        error "Failed to copy content. Check source directory permissions."
    fi
    
    cd "$temp_dir"
    
    # Check for changes
    if git diff --quiet && git diff --cached --quiet; then
        warn "No changes detected. Nothing to publish."
        return 0
    fi
    
    log "Committing changes..."
    git add .
    git commit -m "$COMMIT_MESSAGE"
    
    log "Publishing to $BRANCH..."
    if ! git push origin "$BRANCH"; then
        error "Failed to push changes. Check repository permissions."
    fi
    
    success "Content published successfully!"
}

# Usage display
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Environment Variables:
    REPO_URL        Target repository URL (required)
    SOURCE_DIR      Source directory to publish (default: ./content)
    COMMIT_MESSAGE  Commit message (default: auto-generated)
    BRANCH         Target branch (default: main)

Examples:
    REPO_URL=git@github.com:user/blog.git ./robust-publish.sh
    SOURCE_DIR=./docs REPO_URL=https://github.com/user/docs.git ./robust-publish.sh

EOF
}

# Main execution
main() {
    if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    log "Starting lightweight git publishing..."
    validate_inputs
    publish_content
}

main "$@"
```

### Multi-Repository Publishing
```bash
#!/bin/bash
# multi-publish.sh - Publish to multiple repositories

# Configuration file: repos.conf
# blog,git@github.com:user/blog.git,./blog-content,main
# docs,https://github.com:user/docs.git,./documentation,gh-pages
# portfolio,git@github.com:user/portfolio.git,./projects,main

publish_to_repos() {
    local config_file="${1:-repos.conf}"
    
    if [[ ! -f "$config_file" ]]; then
        echo "❌ Configuration file '$config_file' not found"
        exit 1
    fi
    
    while IFS=',' read -r name repo_url source_dir branch; do
        # Skip comments and empty lines
        [[ "$name" =~ ^#.*$ ]] || [[ -z "$name" ]] && continue
        
        echo "🚀 Publishing $name..."
        
        if REPO_URL="$repo_url" SOURCE_DIR="$source_dir" BRANCH="$branch" ./robust-publish.sh; then
            echo "✅ $name published successfully"
        else
            echo "❌ Failed to publish $name"
        fi
        
        echo "---"
    done < "$config_file"
}

publish_to_repos "$@"
```

## Advanced Workflows: Production-Ready Patterns

### Workflow 1: Branch-Based Content Staging
```bash
#!/bin/bash
# staged-publish.sh - Publish with staging branch

REPO_URL="$1"
SOURCE_DIR="$2"
STAGING_BRANCH="content-staging"
PRODUCTION_BRANCH="main"

temp_dir=$(mktemp -d)
cleanup() { rm -rf "$temp_dir"; }
trap cleanup EXIT

# Clone and create staging branch
git clone "$REPO_URL" "$temp_dir"
cd "$temp_dir"

# Create or switch to staging branch
git checkout -B "$STAGING_BRANCH"

# Update content
cp -r "$SOURCE_DIR"/* .
git add .
git commit -m "Stage content update from $(date)"

# Push staging branch
git push origin "$STAGING_BRANCH"

echo "✅ Content staged in '$STAGING_BRANCH' branch"
echo "📝 Create PR to merge into '$PRODUCTION_BRANCH' when ready"
```

### Workflow 2: Automated Testing Before Publish
```bash
#!/bin/bash
# tested-publish.sh - Test content before publishing

validate_content() {
    local content_dir="$1"
    
    echo "🔍 Validating content..."
    
    # Check for required files
    [[ ! -f "$content_dir/README.md" ]] && {
        echo "❌ README.md is required"
        return 1
    }
    
    # Validate markdown syntax (if markdownlint is available)
    if command -v markdownlint >/dev/null 2>&1; then
        markdownlint "$content_dir"/*.md || {
            echo "❌ Markdown validation failed"
            return 1
        }
    fi
    
    # Check for broken links (if available)
    if command -v markdown-link-check >/dev/null 2>&1; then
        find "$content_dir" -name "*.md" -exec markdown-link-check {} \; || {
            echo "❌ Link validation failed"
            return 1
        }
    fi
    
    echo "✅ Content validation passed"
    return 0
}

# Main publishing with validation
publish_with_tests() {
    local repo_url="$1"
    local source_dir="$2"
    
    # Validate before publishing
    validate_content "$source_dir" || exit 1
    
    # Proceed with publishing
    REPO_URL="$repo_url" SOURCE_DIR="$source_dir" ./robust-publish.sh
}

publish_with_tests "$@"
```

### Workflow 3: Content Backup and Rollback
```bash
#!/bin/bash
# backup-publish.sh - Publish with automatic backup

create_backup() {
    local repo_url="$1"
    local backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
    
    mkdir -p "$backup_dir"
    git clone "$repo_url" "$backup_dir/current-state"
    
    echo "💾 Backup created: $backup_dir"
    echo "$backup_dir" > .last-backup
}

rollback_last() {
    if [[ ! -f .last-backup ]]; then
        echo "❌ No backup found"
        exit 1
    fi
    
    local backup_dir=$(cat .last-backup)
    local repo_url="$1"
    
    if [[ ! -d "$backup_dir" ]]; then
        echo "❌ Backup directory not found: $backup_dir"
        exit 1
    fi
    
    echo "🔄 Rolling back to $backup_dir..."
    
    temp_dir=$(mktemp -d)
    git clone "$repo_url" "$temp_dir"
    
    cd "$temp_dir"
    cp -r "$backup_dir/current-state"/* .
    git add .
    git commit -m "Rollback to $(basename $backup_dir)"
    git push origin main
    
    echo "✅ Rollback completed"
}

# Main function with backup
backup_and_publish() {
    local action="$1"
    local repo_url="$2"
    local source_dir="$3"
    
    case "$action" in
        "publish")
            create_backup "$repo_url"
            REPO_URL="$repo_url" SOURCE_DIR="$source_dir" ./robust-publish.sh
            ;;
        "rollback")
            rollback_last "$repo_url"
            ;;
        *)
            echo "Usage: $0 {publish|rollback} REPO_URL [SOURCE_DIR]"
            exit 1
            ;;
    esac
}

backup_and_publish "$@"
```

## Best Practices and Security

### Security Considerations
- **Use SSH keys** instead of HTTPS for authentication when possible
- **Never commit secrets** to temporary directories  
- **Clean up thoroughly** to prevent credential leakage
- **Validate repository URLs** to prevent malicious redirects

### Performance Optimizations
- **Shallow clones** (`--depth 1`) for faster operations
- **Sparse checkout** for large repositories with specific paths
- **Parallel operations** when publishing to multiple repositories
- **Caching** for frequently accessed repositories

### Error Handling Patterns
```bash
# Robust error handling template
safe_publish() {
    local temp_dir
    temp_dir=$(mktemp -d) || {
        echo "❌ Failed to create temporary directory"
        return 1
    }
    
    # Cleanup function
    cleanup() {
        local exit_code=$?
        [[ -d "$temp_dir" ]] && rm -rf "$temp_dir"
        return $exit_code
    }
    trap cleanup EXIT
    
    # Your publishing logic here with proper error checking
    git clone "$REPO_URL" "$temp_dir" || {
        echo "❌ Clone failed"
        return 1
    }
    
    # Continue with error-checked operations...
}
```

## Real-World Examples

### Example 1: Documentation Publishing
```bash
# Publish project docs to documentation site
REPO_URL=git@github.com:company/docs.git \
SOURCE_DIR=./documentation \
COMMIT_MESSAGE="Update API docs from $(git rev-parse --short HEAD)" \
./robust-publish.sh
```

### Example 2: Blog Post from Current Project
```bash
# Publish blog post about current development
mkdir -p blog-content
echo "# My Development Journey with Project X" > blog-content/project-x.md
# ... write content ...

git-publish git@github.com:user/blog.git ./blog-content
```

### Example 3: Multi-Site Publishing
```bash
# Publish same content to multiple platforms
echo "blog,git@github.com:user/blog.git,./content,main
docs,git@github.com:user/docs.git,./content,gh-pages
backup,git@gitlab.com:user/backup.git,./content,main" > repos.conf

./multi-publish.sh repos.conf
```

---

## Lightweight by Design

Notice how the beauty of lightweight git publishing lies in its temporary nature. No permanent setup, no long-term maintenance, no coupling between unrelated repositories. Just immediate, clean publishing that gets out of your way.

These patterns work because they embrace git's fundamental strength: repositories are cheap, cloning is fast, and automation is straightforward. Treating publishing as a temporary operation rather than permanent infrastructure eliminates most of the friction that makes developers avoid documenting their work.

Consider the difference: instead of building sophisticated CI/CD pipelines, we make publishing so frictionless that you'll actually do it.

Whether you're documenting a discovery mid-project, sharing a technique you just learned, or publishing polished content to multiple sites, these lightweight approaches let you stay in flow while sharing knowledge.

Pick the approach that matches your current workflow, customize it for your needs, and start publishing without the setup overhead.

Your future self (and the developer community) will thank you.

---

### Quick Reference Commands

```bash
# One-liner temporary publish
git clone REPO_URL /tmp/publish && cp -r ./content/* /tmp/publish/ && cd /tmp/publish && git add . && git commit -m "Update" && git push && cd - && rm -rf /tmp/publish

# Function for daily use  
git-publish() { local temp=$(mktemp -d); git clone $1 $temp && cp -r $2/* $temp/ && cd $temp && git add . && git commit -m "Update from $(basename $(pwd))" && git push && cd - && rm -rf $temp; }

# Robust script with error handling
./robust-publish.sh  # Using environment variables
```

**Remember**: The best publishing workflow is the one you'll actually use. Start simple, automate gradually, and keep it lightweight.

## 📖 Table of Contents

1. [The Problem](./1-the-problem.md)
2. [Existing Solutions](./2-existing-solutions.md)
3. [Lightweight Approaches](./3-lightweight-approaches.md)
4. [Custom Scripts & Functions](./4-custom-scripts.md)
5. [Advanced Workflows](./5-advanced-workflows.md)

## 🎯 What You'll Learn

- **Temporary deployment** strategies that require no permanent setup
- **Command-line tools** for cross-repository content publishing
- **Shell functions** for one-command deployments
- **Best practices** for maintaining clean workflows
- **Real-world examples** for blog publishing, documentation, and more

## 🚀 Quick Start

Need to deploy content right now? Jump to our [lightweight approaches](./3-lightweight-approaches.md) for immediate solutions.

## 💡 Use Cases

This guide is perfect for developers who:

- Write blog posts about their current projects
- Need to deploy documentation to separate repositories
- Want to publish content without cluttering their main workspace
- Frequently switch between projects and need portable solutions
- Prefer command-line workflows over GUI tools

## 🔧 Prerequisites

- Basic Git knowledge
- Command-line familiarity
- Access to target repositories (push permissions)

## 📚 Related Resources

- [Official Git Documentation](https://git-scm.com/docs)
- [GitHub CLI Documentation](https://cli.github.com/)
- [Git Subtree Guide](https://www.atlassian.com/git/tutorials/git-subtree)

## 🤝 Contributing

Found improvements or additional tools? Feel free to suggest changes or additions to make this guide even more useful for the developer community.

---

*This guide focuses on practical, lightweight solutions that work across different operating systems and project types.* 