# 3. Lightweight Approaches

## The Philosophy

Instead of installing tools or setting up permanent configurations, we'll use **ephemeral solutions** that:
- Require no setup
- Leave no trace
- Work anywhere
- Use standard tools

## Approach 1: One-Liner Shell Commands

### Basic Clone-Copy-Push Pattern

```bash
# Basic template
(d=$(mktemp -d) && git clone REPO_URL $d && cp -r SOURCE_DIR/* $d/TARGET_PATH/ && cd $d && git add . && git commit -m "MESSAGE" && git push && cd - && rm -rf $d)

# Real example
(d=$(mktemp -d) && git clone https://github.com/user/blog.git $d && cp -r ./my-post/* $d/posts/ && cd $d && git add . && git commit -m "Add new post" && git push && cd - && rm -rf $d)
```

**How it works:**
1. Creates temporary directory
2. Clones target repository
3. Copies your content
4. Commits and pushes changes
5. Cleans up temporary directory
6. Returns to original location

**Pros:**
- ✅ No setup required
- ✅ Single command execution
- ✅ Automatic cleanup
- ✅ Works with any Git repository

**Cons:**
- ❌ Long command syntax
- ❌ Hard to remember
- ❌ Limited error handling

### Enhanced One-Liner with Variables

```bash
# Set variables for easier reuse
BLOG_REPO="https://github.com/user/blog.git"
CONTENT_DIR="./my-post"
TARGET_PATH="posts"
MESSAGE="Add post from $(basename $PWD)"

# Execute
(d=$(mktemp -d) && git clone $BLOG_REPO $d && cp -r $CONTENT_DIR/* $d/$TARGET_PATH/ && cd $d && git add . && git commit -m "$MESSAGE" && git push && cd - && rm -rf $d)
```

## Approach 2: Temporary Shell Functions

Define functions when you need them, without permanent installation.

### Basic Function

```bash
# Define function in current shell session
git_publish() {
    local source_dir=$1
    local repo_url=$2
    local target_path=${3:-"."}
    local message=${4:-"Publish from $(basename $PWD)"}
    
    local temp_dir=$(mktemp -d)
    
    echo "📦 Cloning $repo_url..."
    git clone "$repo_url" "$temp_dir" || return 1
    
    echo "📁 Copying $source_dir to $target_path..."
    mkdir -p "$temp_dir/$target_path"
    cp -r "$source_dir"/* "$temp_dir/$target_path/" || return 1
    
    echo "💾 Committing changes..."
    cd "$temp_dir"
    git add -A
    git commit -m "$message" || return 1
    
    echo "🚀 Pushing to remote..."
    git push || return 1
    
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    echo "✅ Published successfully!"
}

# Usage
git_publish ./blog-post https://github.com/user/blog.git posts
```

### Enhanced Function with Options

```bash
git_publish_advanced() {
    local source_dir=""
    local repo_url=""
    local target_path="."
    local message=""
    local branch="main"
    local dry_run=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--source)
                source_dir="$2"
                shift 2
                ;;
            -r|--repo)
                repo_url="$2"
                shift 2
                ;;
            -t|--target)
                target_path="$2"
                shift 2
                ;;
            -m|--message)
                message="$2"
                shift 2
                ;;
            -b|--branch)
                branch="$2"
                shift 2
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                return 1
                ;;
        esac
    done
    
    # Validation
    if [[ -z "$source_dir" || -z "$repo_url" ]]; then
        echo "Usage: git_publish_advanced -s SOURCE_DIR -r REPO_URL [options]"
        return 1
    fi
    
    if [[ -z "$message" ]]; then
        message="Publish from $(basename $PWD) on $(date '+%Y-%m-%d %H:%M')"
    fi
    
    local temp_dir=$(mktemp -d)
    
    if $dry_run; then
        echo "🔍 DRY RUN - Would execute:"
        echo "  Clone: $repo_url (branch: $branch)"
        echo "  Copy: $source_dir -> $target_path"
        echo "  Message: $message"
        echo "  Temp dir: $temp_dir"
        rm -rf "$temp_dir"
        return 0
    fi
    
    # Execute publishing steps...
    # (same as basic function, but with branch support)
}

# Usage examples
git_publish_advanced -s ./docs -r https://github.com/user/docs.git -t documentation -b gh-pages
git_publish_advanced -s ./post -r https://github.com/user/blog.git --dry-run
```

## Approach 3: Fish Shell Functions

For Fish shell users, here's a more Fish-native approach:

```fish
function git_publish --description "Publish directory to another repository"
    # Parse arguments
    argparse 's/source=' 'r/repo=' 't/target=' 'm/message=' 'b/branch=' 'dry-run' -- $argv
    
    if not set -q _flag_source; or not set -q _flag_repo
        echo "Usage: git_publish -s SOURCE_DIR -r REPO_URL [options]"
        return 1
    end
    
    set -l temp_dir (mktemp -d)
    set -l target_path (test -n "$_flag_target"; and echo $_flag_target; or echo ".")
    set -l branch (test -n "$_flag_branch"; and echo $_flag_branch; or echo "main")
    set -l message (test -n "$_flag_message"; and echo $_flag_message; or echo "Publish from "(basename (pwd))" on "(date))
    
    if set -q _flag_dry_run
        echo "🔍 DRY RUN - Would execute:"
        echo "  Clone: $_flag_repo (branch: $branch)"
        echo "  Copy: $_flag_source -> $target_path"
        echo "  Message: $message"
        rm -rf $temp_dir
        return 0
    end
    
    echo "📦 Cloning $_flag_repo..."
    if not git clone --branch $branch $_flag_repo $temp_dir
        echo "❌ Failed to clone repository"
        rm -rf $temp_dir
        return 1
    end
    
    echo "📁 Copying $_flag_source to $target_path..."
    mkdir -p $temp_dir/$target_path
    if not cp -r $_flag_source/* $temp_dir/$target_path/
        echo "❌ Failed to copy files"
        rm -rf $temp_dir
        return 1
    end
    
    echo "💾 Committing changes..."
    cd $temp_dir
    git add -A
    if not git commit -m "$message"
        echo "❌ Failed to commit (no changes?)"
        cd -
        rm -rf $temp_dir
        return 1
    end
    
    echo "🚀 Pushing to remote..."
    if not git push
        echo "❌ Failed to push changes"
        cd -
        rm -rf $temp_dir
        return 1
    end
    
    cd -
    rm -rf $temp_dir
    echo "✅ Published successfully!"
end

# Usage
git_publish -s ./blog-post -r https://github.com/user/blog.git -t posts
```

## Approach 4: Rsync-based Deployment

For more control over file synchronization:

```bash
git_sync_deploy() {
    local source_dir=$1
    local repo_url=$2
    local target_path=${3:-"."}
    local message=${4:-"Sync from $(basename $PWD)"}
    
    local temp_dir=$(mktemp -d)
    
    # Clone target repository
    git clone "$repo_url" "$temp_dir" || return 1
    
    # Sync files with rsync (preserves, deletes, etc.)
    rsync -av --delete "$source_dir/" "$temp_dir/$target_path/" || return 1
    
    # Commit and push
    cd "$temp_dir"
    git add -A
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo "📝 No changes to publish"
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 0
    fi
    
    git commit -m "$message"
    git push
    
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    echo "✅ Synchronized successfully!"
}
```

## Quick Reference Card

Save this as a quick reference:

```bash
# === LIGHTWEIGHT GIT PUBLISHING ===

# 1. One-liner (basic)
(d=$(mktemp -d) && git clone REPO $d && cp -r SOURCE/* $d/TARGET/ && cd $d && git add . && git commit -m "MSG" && git push && cd - && rm -rf $d)

# 2. Function definition (paste when needed)
git_publish() {
    local src=$1 repo=$2 target=${3:-.} msg=${4:-"Publish from $(basename $PWD)"}
    local tmp=$(mktemp -d)
    git clone "$repo" "$tmp" && cp -r "$src"/* "$tmp/$target/" && cd "$tmp" && git add -A && git commit -m "$msg" && git push && cd - && rm -rf "$tmp"
}

# 3. Usage examples
git_publish ./blog-post https://github.com/user/blog.git posts
git_publish ./docs https://github.com/user/docs.git documentation "Update docs"

# 4. With error handling (enhanced)
git_publish_safe() {
    local src=$1 repo=$2 target=${3:-.} msg=${4:-"Publish $(date)"}
    local tmp=$(mktemp -d)
    git clone "$repo" "$tmp" && \
    cp -r "$src"/* "$tmp/$target/" && \
    cd "$tmp" && \
    git add -A && \
    git commit -m "$msg" && \
    git push && \
    cd - > /dev/null && \
    rm -rf "$tmp" && \
    echo "✅ Published successfully!" || \
    (echo "❌ Failed to publish"; rm -rf "$tmp"; return 1)
}
```

## When to Use Each Approach

- **One-liner**: Quick, one-off publishing tasks
- **Basic function**: Repeated use in same session
- **Enhanced function**: Complex workflows, multiple options
- **Fish function**: Fish shell users wanting native syntax
- **Rsync approach**: When you need file synchronization features

In the next chapter, we'll explore how to create reusable custom scripts for more complex scenarios. 