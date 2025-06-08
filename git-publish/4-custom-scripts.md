# 4. Custom Scripts & Functions

## Reusable Script Templates

For teams or repeated workflows, you might want more permanent solutions that are still lightweight and portable.

## Standalone Shell Script

Create a portable script that can be copied to any project:

```bash
#!/bin/bash
# git-publish.sh - Lightweight cross-repository publishing

set -e

# Configuration
DEFAULT_BRANCH="main"
DEFAULT_MESSAGE="Publish from $(basename $PWD) on $(date '+%Y-%m-%d %H:%M')"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    cat << EOF
git-publish.sh - Lightweight Git Publishing Tool

USAGE:
    ./git-publish.sh [OPTIONS] SOURCE_DIR REPO_URL [TARGET_PATH]

ARGUMENTS:
    SOURCE_DIR    Directory to publish (relative to current directory)
    REPO_URL      Target repository URL (https or ssh)
    TARGET_PATH   Path within target repo (optional, defaults to root)

OPTIONS:
    -b, --branch BRANCH    Target branch (default: main)
    -m, --message MSG      Commit message (default: auto-generated)
    --dry-run              Show what would be done without executing
    -h, --help             Show this help message

EXAMPLES:
    # Publish blog post to posts directory
    ./git-publish.sh ./my-post https://github.com/user/blog.git posts

    # Publish docs to different branch
    ./git-publish.sh --branch gh-pages ./docs https://github.com/user/docs.git

    # Test run without actually publishing
    ./git-publish.sh --dry-run ./content https://github.com/user/site.git

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--branch)
                BRANCH="$2"
                shift 2
                ;;
            -m|--message)
                MESSAGE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                # Positional arguments
                if [[ -z "$SOURCE_DIR" ]]; then
                    SOURCE_DIR="$1"
                elif [[ -z "$REPO_URL" ]]; then
                    REPO_URL="$1"
                elif [[ -z "$TARGET_PATH" ]]; then
                    TARGET_PATH="$1"
                else
                    log_error "Too many arguments"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Set defaults
    BRANCH="${BRANCH:-$DEFAULT_BRANCH}"
    MESSAGE="${MESSAGE:-$DEFAULT_MESSAGE}"
    TARGET_PATH="${TARGET_PATH:-.}"
    DRY_RUN="${DRY_RUN:-false}"

    # Validate required arguments
    if [[ -z "$SOURCE_DIR" || -z "$REPO_URL" ]]; then
        log_error "SOURCE_DIR and REPO_URL are required"
        show_help
        exit 1
    fi

    # Validate source directory exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_error "Source directory does not exist: $SOURCE_DIR"
        exit 1
    fi
}

# Main publishing function
publish() {
    local temp_dir=$(mktemp -d)
    
    log_info "Publishing Configuration:"
    log_info "  Source: $SOURCE_DIR"
    log_info "  Repository: $REPO_URL"
    log_info "  Target: $TARGET_PATH"
    log_info "  Branch: $BRANCH"
    log_info "  Message: $MESSAGE"
    log_info "  Temp dir: $temp_dir"

    if $DRY_RUN; then
        log_warning "DRY RUN - No actual changes will be made"
        rm -rf "$temp_dir"
        return 0
    fi

    # Clone repository
    log_info "Cloning repository..."
    if ! git clone --branch "$BRANCH" "$REPO_URL" "$temp_dir" 2>/dev/null; then
        log_warning "Branch '$BRANCH' not found, trying default branch..."
        if ! git clone "$REPO_URL" "$temp_dir"; then
            log_error "Failed to clone repository"
            rm -rf "$temp_dir"
            exit 1
        fi
        
        # Switch to target branch (create if doesn't exist)
        cd "$temp_dir"
        if ! git checkout "$BRANCH" 2>/dev/null; then
            log_info "Creating new branch: $BRANCH"
            git checkout -b "$BRANCH"
        fi
        cd - > /dev/null
    fi

    # Prepare target directory
    mkdir -p "$temp_dir/$TARGET_PATH"

    # Copy files
    log_info "Copying files..."
    if ! cp -r "$SOURCE_DIR"/* "$temp_dir/$TARGET_PATH/"; then
        log_error "Failed to copy files"
        rm -rf "$temp_dir"
        exit 1
    fi

    # Commit changes
    cd "$temp_dir"
    git add -A

    # Check if there are changes to commit
    if git diff --staged --quiet; then
        log_warning "No changes to commit"
        cd - > /dev/null
        rm -rf "$temp_dir"
        return 0
    fi

    log_info "Committing changes..."
    if ! git commit -m "$MESSAGE"; then
        log_error "Failed to commit changes"
        cd - > /dev/null
        rm -rf "$temp_dir"
        exit 1
    fi

    # Push changes
    log_info "Pushing to remote..."
    if ! git push origin "$BRANCH"; then
        log_error "Failed to push changes"
        cd - > /dev/null
        rm -rf "$temp_dir"
        exit 1
    fi

    cd - > /dev/null
    rm -rf "$temp_dir"

    log_success "Published successfully!"
}

# Main execution
main() {
    parse_args "$@"
    publish
}

main "$@"
```

## Fish Shell Function Library

For Fish shell users, create a functions file:

```fish
# ~/.config/fish/functions/git_publish.fish

function git_publish --description "Lightweight git publishing"
    # Parse arguments with validation
    argparse --min-args=2 --max-args=3 \
        'b/branch=' \
        'm/message=' \
        'dry-run' \
        'h/help' \
        -- $argv
    or return 1

    if set -q _flag_help
        echo "Usage: git_publish [OPTIONS] SOURCE_DIR REPO_URL [TARGET_PATH]"
        echo ""
        echo "Options:"
        echo "  -b, --branch BRANCH    Target branch (default: main)"
        echo "  -m, --message MSG      Commit message"
        echo "  --dry-run              Show what would be done"
        echo "  -h, --help             Show this help"
        return 0
    end

    set -l source_dir $argv[1]
    set -l repo_url $argv[2]
    set -l target_path (test (count $argv) -ge 3; and echo $argv[3]; or echo ".")
    set -l branch (test -n "$_flag_branch"; and echo $_flag_branch; or echo "main")
    set -l message (test -n "$_flag_message"; and echo $_flag_message; or echo "Publish from "(basename (pwd))" on "(date))

    # Validation
    if not test -d $source_dir
        echo "Error: Source directory '$source_dir' does not exist"
        return 1
    end

    set -l temp_dir (mktemp -d)

    echo "📋 Publishing Configuration:"
    echo "  Source: $source_dir"
    echo "  Repository: $repo_url"
    echo "  Target: $target_path"
    echo "  Branch: $branch"
    echo "  Message: $message"

    if set -q _flag_dry_run
        echo "🔍 DRY RUN - No changes will be made"
        rm -rf $temp_dir
        return 0
    end

    # Execute publishing
    echo "📦 Cloning repository..."
    if not git clone --branch $branch $repo_url $temp_dir 2>/dev/null
        echo "⚠️  Branch '$branch' not found, trying default..."
        if not git clone $repo_url $temp_dir
            echo "❌ Failed to clone repository"
            rm -rf $temp_dir
            return 1
        end
    end

    echo "📁 Copying files..."
    mkdir -p $temp_dir/$target_path
    if not cp -r $source_dir/* $temp_dir/$target_path/
        echo "❌ Failed to copy files"
        rm -rf $temp_dir
        return 1
    end

    echo "💾 Committing changes..."
    cd $temp_dir
    git add -A

    if git diff --staged --quiet
        echo "📝 No changes to commit"
        cd -
        rm -rf $temp_dir
        return 0
    end

    if not git commit -m "$message"
        echo "❌ Failed to commit"
        cd -
        rm -rf $temp_dir
        return 1
    end

    echo "🚀 Pushing to remote..."
    if not git push origin $branch
        echo "❌ Failed to push"
        cd -
        rm -rf $temp_dir
        return 1
    end

    cd -
    rm -rf $temp_dir
    echo "✅ Published successfully!"
end

# Convenience aliases
function blog_publish --description "Publish to blog repository"
    git_publish $argv[1] https://github.com/yourusername/blog.git posts $argv[2..-1]
end

function docs_publish --description "Publish to documentation repository"
    git_publish $argv[1] https://github.com/yourusername/docs.git documentation $argv[2..-1]
end
```

## Configuration-Driven Approach

For projects with multiple publishing targets:

```bash
#!/bin/bash
# git-publish-config.sh - Configuration-driven publishing

# Configuration file format (.publish-config):
# TARGET_NAME:REPO_URL:TARGET_PATH:BRANCH
# blog:https://github.com/user/blog.git:posts:main
# docs:https://github.com/user/docs.git:documentation:gh-pages

load_config() {
    local config_file=".publish-config"
    
    if [[ ! -f "$config_file" ]]; then
        echo "No .publish-config file found"
        echo "Create one with format: TARGET_NAME:REPO_URL:TARGET_PATH:BRANCH"
        exit 1
    fi
    
    while IFS=':' read -r name repo path branch; do
        # Skip comments and empty lines
        [[ "$name" =~ ^#.*$ ]] || [[ -z "$name" ]] && continue
        
        declare -g "TARGET_${name^^}_REPO=$repo"
        declare -g "TARGET_${name^^}_PATH=$path"
        declare -g "TARGET_${name^^}_BRANCH=$branch"
        
        echo "Loaded target: $name -> $repo:$path ($branch)"
    done < "$config_file"
}

publish_to_target() {
    local target_name="$1"
    local source_dir="$2"
    local message="$3"
    
    local repo_var="TARGET_${target_name^^}_REPO"
    local path_var="TARGET_${target_name^^}_PATH"
    local branch_var="TARGET_${target_name^^}_BRANCH"
    
    local repo_url="${!repo_var}"
    local target_path="${!path_var}"
    local branch="${!branch_var}"
    
    if [[ -z "$repo_url" ]]; then
        echo "Unknown target: $target_name"
        list_targets
        exit 1
    fi
    
    echo "Publishing $source_dir to $target_name..."
    git_publish "$source_dir" "$repo_url" "$target_path" "$message" "$branch"
}

list_targets() {
    echo "Available targets:"
    env | grep "^TARGET_.*_REPO=" | sed 's/TARGET_\(.*\)_REPO=.*/  \1/' | tr '[:upper:]' '[:lower:]'
}

# Usage: ./git-publish-config.sh TARGET_NAME SOURCE_DIR [MESSAGE]
if [[ "$1" == "list" ]]; then
    load_config
    list_targets
else
    load_config
    publish_to_target "$1" "$2" "${3:-Auto-publish $(date)}"
fi
```

Example `.publish-config` file:
```
# Publishing targets configuration
# Format: TARGET_NAME:REPO_URL:TARGET_PATH:BRANCH

blog:https://github.com/username/blog.git:posts:main
docs:https://github.com/username/docs.git:documentation:gh-pages
examples:https://github.com/username/code-examples.git:.:main
portfolio:https://github.com/username/portfolio.git:projects:main
```

Usage:
```bash
# List available targets
./git-publish-config.sh list

# Publish to specific targets
./git-publish-config.sh blog ./my-blog-post
./git-publish-config.sh docs ./documentation
./git-publish-config.sh examples ./code-samples "Add new examples"
```

## Integration with Build Tools

### Make Integration

```makefile
# Makefile
.PHONY: publish-blog publish-docs publish-all

PUBLISH_SCRIPT := ./scripts/git-publish.sh

publish-blog:
	$(PUBLISH_SCRIPT) ./blog-posts https://github.com/user/blog.git posts

publish-docs:
	$(PUBLISH_SCRIPT) --branch gh-pages ./docs https://github.com/user/docs.git

publish-all: publish-blog publish-docs
	@echo "All publishing targets completed"
```

### Package.json Scripts

```json
{
  "scripts": {
    "publish:blog": "./scripts/git-publish.sh ./blog-posts https://github.com/user/blog.git posts",
    "publish:docs": "./scripts/git-publish.sh --branch gh-pages ./docs https://github.com/user/docs.git",
    "publish:all": "npm run publish:blog && npm run publish:docs"
  }
}
```

## Best Practices for Custom Scripts

### Error Handling
- Always use `set -e` for bash scripts
- Implement cleanup on script exit
- Validate inputs before processing
- Provide meaningful error messages

### Logging
- Use consistent log levels (info, warning, error)
- Add timestamps for debugging
- Make output parseable for automation

### Security
- Validate repository URLs
- Don't log sensitive information
- Use SSH keys over HTTPS tokens when possible
- Implement timeout mechanisms

### Portability
- Test on multiple operating systems
- Use POSIX-compatible commands when possible
- Document system requirements
- Handle different Git configurations

In the next chapter, we'll explore advanced workflows for complex publishing scenarios. 