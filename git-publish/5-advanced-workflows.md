# 5. Advanced Workflows

## Complex Publishing Scenarios

Beyond simple file copying, real-world publishing often requires preprocessing, validation, and integration with existing workflows.

## Content Transformation Workflows

### Markdown Processing Pipeline

```bash
#!/bin/bash
# advanced-blog-publish.sh - Process and publish blog posts

process_and_publish() {
    local source_dir=$1
    local repo_url=$2
    local target_path=${3:-"posts"}
    
    local temp_dir=$(mktemp -d)
    local processed_dir="$temp_dir/processed"
    
    echo "🔄 Processing content pipeline..."
    
    # Clone target repository
    git clone "$repo_url" "$temp_dir" || return 1
    mkdir -p "$processed_dir"
    
    # Process each markdown file
    for md_file in "$source_dir"/*.md; do
        if [[ -f "$md_file" ]]; then
            local filename=$(basename "$md_file")
            local output_file="$processed_dir/$filename"
            
            echo "📝 Processing $filename..."
            
            # Add frontmatter if missing
            if ! head -1 "$md_file" | grep -q "^---"; then
                {
                    echo "---"
                    echo "title: $(basename "$md_file" .md | tr '-' ' ' | sed 's/\b\w/\U&/g')"
                    echo "date: $(date '+%Y-%m-%d')"
                    echo "author: $(git config user.name)"
                    echo "tags: []"
                    echo "---"
                    echo ""
                    cat "$md_file"
                } > "$output_file"
            else
                cp "$md_file" "$output_file"
            fi
            
            # Process images/assets
            if [[ -d "$source_dir/assets" ]]; then
                mkdir -p "$temp_dir/$target_path/assets"
                cp -r "$source_dir/assets"/* "$temp_dir/$target_path/assets/"
                
                # Update image paths in markdown
                sed -i.bak 's|!\[\([^]]*\)\](\./assets/|![\1](../assets/|g' "$output_file"
                rm "$output_file.bak"
            fi
        fi
    done
    
    # Copy processed files
    cp -r "$processed_dir"/* "$temp_dir/$target_path/"
    
    # Generate index if needed
    if command -v hugo &> /dev/null || command -v jekyll &> /dev/null; then
        echo "🏗️ Building static site..."
        cd "$temp_dir"
        # Run static site generator
        # hugo build || jekyll build
    fi
    
    # Commit and push
    cd "$temp_dir"
    git add -A
    
    if ! git diff --staged --quiet; then
        git commit -m "Publish processed content from $(basename "$source_dir")"
        git push
        echo "✅ Published with content processing"
    else
        echo "📝 No changes after processing"
    fi
    
    cd - > /dev/null
    rm -rf "$temp_dir"
}

# Usage
process_and_publish ./my-blog-post https://github.com/user/blog.git posts
```

### Multi-Format Publishing

```bash
# multi-format-publish.sh - Publish to multiple formats/platforms

publish_multi_format() {
    local source_dir=$1
    local config_file=${2:-"publish-targets.yml"}
    
    # Read YAML config (requires yq)
    local targets=$(yq eval '.targets[].name' "$config_file")
    
    for target in $targets; do
        local repo=$(yq eval ".targets[] | select(.name == \"$target\") | .repo" "$config_file")
        local path=$(yq eval ".targets[] | select(.name == \"$target\") | .path" "$config_file")
        local format=$(yq eval ".targets[] | select(.name == \"$target\") | .format" "$config_file")
        local processor=$(yq eval ".targets[] | select(.name == \"$target\") | .processor" "$config_file")
        
        echo "🎯 Publishing to $target (format: $format)..."
        
        case $format in
            "markdown")
                git_publish "$source_dir" "$repo" "$path"
                ;;
            "html")
                convert_and_publish_html "$source_dir" "$repo" "$path" "$processor"
                ;;
            "pdf")
                convert_and_publish_pdf "$source_dir" "$repo" "$path"
                ;;
            *)
                echo "Unknown format: $format"
                ;;
        esac
    done
}

convert_and_publish_html() {
    local source_dir=$1
    local repo_url=$2
    local target_path=$3
    local processor=${4:-"pandoc"}
    
    local temp_source=$(mktemp -d)
    local temp_target=$(mktemp -d)
    
    # Convert markdown to HTML
    for md_file in "$source_dir"/*.md; do
        if [[ -f "$md_file" ]]; then
            local html_file="$temp_source/$(basename "$md_file" .md).html"
            
            case $processor in
                "pandoc")
                    pandoc "$md_file" -o "$html_file" --standalone
                    ;;
                "markdown")
                    markdown "$md_file" > "$html_file"
                    ;;
                *)
                    echo "Unknown processor: $processor"
                    return 1
                    ;;
            esac
        fi
    done
    
    # Copy assets
    if [[ -d "$source_dir/assets" ]]; then
        cp -r "$source_dir/assets" "$temp_source/"
    fi
    
    # Publish HTML version
    git_publish "$temp_source" "$repo_url" "$target_path"
    
    rm -rf "$temp_source" "$temp_target"
}
```

Example `publish-targets.yml`:
```yaml
targets:
  - name: blog
    repo: https://github.com/user/blog.git
    path: posts
    format: markdown
    
  - name: docs-site
    repo: https://github.com/user/docs-site.git
    path: content
    format: html
    processor: pandoc
    
  - name: portfolio
    repo: https://github.com/user/portfolio.git
    path: projects
    format: markdown
```

## Automated Workflows

### Git Hook Integration

```bash
#!/bin/bash
# .git/hooks/post-commit - Auto-publish on commit

# Only run on specific branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
    exit 0
fi

# Check if blog posts were modified
if git diff --name-only HEAD~1 HEAD | grep -q "blog-posts/"; then
    echo "📝 Blog posts modified, auto-publishing..."
    
    # Find changed blog posts
    changed_posts=$(git diff --name-only HEAD~1 HEAD | grep "blog-posts/" | head -1 | xargs dirname)
    
    if [[ -n "$changed_posts" && -d "$changed_posts" ]]; then
        ./scripts/git-publish.sh "$changed_posts" https://github.com/user/blog.git posts
    fi
fi
```

### CI/CD Integration

**GitHub Actions Workflow**:
```yaml
# .github/workflows/auto-publish.yml
name: Auto-publish content

on:
  push:
    paths:
      - 'blog-posts/**'
      - 'documentation/**'
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v3
        
      - name: Setup Git
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"
          
      - name: Publish blog posts
        if: contains(github.event.head_commit.modified, 'blog-posts/')
        run: |
          ./scripts/git-publish.sh ./blog-posts ${{ secrets.BLOG_REPO_URL }} posts
          
      - name: Publish documentation
        if: contains(github.event.head_commit.modified, 'documentation/')
        run: |
          ./scripts/git-publish.sh ./documentation ${{ secrets.DOCS_REPO_URL }} docs
```

### Watch-based Auto-publishing

```bash
#!/bin/bash
# watch-and-publish.sh - Watch directory for changes and auto-publish

watch_directory() {
    local watch_dir=$1
    local repo_url=$2
    local target_path=$3
    local debounce_seconds=${4:-5}
    
    echo "👀 Watching $watch_dir for changes..."
    echo "📤 Will publish to $repo_url:$target_path"
    echo "⏱️  Debounce: ${debounce_seconds}s"
    
    if command -v fswatch &> /dev/null; then
        # macOS/BSD - use fswatch
        fswatch -o "$watch_dir" | while read num_changes; do
            echo "🔄 Changes detected, waiting ${debounce_seconds}s..."
            sleep $debounce_seconds
            
            echo "📤 Publishing changes..."
            git_publish "$watch_dir" "$repo_url" "$target_path" "Auto-publish $(date)"
        done
    elif command -v inotifywait &> /dev/null; then
        # Linux - use inotify
        while inotifywait -r -e modify,create,delete "$watch_dir"; do
            echo "🔄 Changes detected, waiting ${debounce_seconds}s..."
            sleep $debounce_seconds
            
            echo "📤 Publishing changes..."
            git_publish "$watch_dir" "$repo_url" "$target_path" "Auto-publish $(date)"
        done
    else
        echo "❌ No file watching tool available (fswatch or inotifywait)"
        exit 1
    fi
}

# Usage
watch_directory ./blog-posts https://github.com/user/blog.git posts 10
```

## Content Validation & Quality Checks

### Pre-publish Validation

```bash
#!/bin/bash
# validate-and-publish.sh - Validate content before publishing

validate_content() {
    local source_dir=$1
    local errors=0
    
    echo "🔍 Validating content in $source_dir..."
    
    # Check markdown syntax
    for md_file in "$source_dir"/*.md; do
        if [[ -f "$md_file" ]]; then
            echo "📝 Checking $md_file..."
            
            # Check for required frontmatter
            if ! head -10 "$md_file" | grep -q "^title:"; then
                echo "❌ Missing title in $md_file"
                ((errors++))
            fi
            
            # Check for broken links
            if command -v markdown-link-check &> /dev/null; then
                if ! markdown-link-check "$md_file" --quiet; then
                    echo "❌ Broken links in $md_file"
                    ((errors++))
                fi
            fi
            
            # Check for spelling (if aspell available)
            if command -v aspell &> /dev/null; then
                local misspelled=$(aspell list < "$md_file" | wc -l)
                if [[ $misspelled -gt 0 ]]; then
                    echo "⚠️  $misspelled potential spelling errors in $md_file"
                fi
            fi
            
            # Check image references
            local missing_images=$(grep -oE '!\[.*\]\([^)]+\)' "$md_file" | \
                                 sed 's/.*(\([^)]*\)).*/\1/' | \
                                 while read img; do
                                     if [[ ! -f "$source_dir/$img" ]]; then
                                         echo "$img"
                                     fi
                                 done | wc -l)
            
            if [[ $missing_images -gt 0 ]]; then
                echo "❌ $missing_images missing images in $md_file"
                ((errors++))
            fi
        fi
    done
    
    return $errors
}

safe_publish() {
    local source_dir=$1
    local repo_url=$2
    local target_path=$3
    
    if validate_content "$source_dir"; then
        echo "✅ Content validation passed"
        git_publish "$source_dir" "$repo_url" "$target_path"
    else
        echo "❌ Content validation failed - not publishing"
        return 1
    fi
}

# Usage
safe_publish ./blog-post https://github.com/user/blog.git posts
```

## Cross-Platform Considerations

### Windows Compatibility

```bash
#!/bin/bash
# cross-platform-publish.sh - Works on Windows (Git Bash), macOS, Linux

detect_platform() {
    case "$(uname -s)" in
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

create_temp_dir() {
    local platform=$(detect_platform)
    
    case $platform in
        "windows")
            # Windows temp directory handling
            local temp_base="${TEMP:-/tmp}"
            mktemp -d "$temp_base/git-publish.XXXXXX"
            ;;
        *)
            mktemp -d
            ;;
    esac
}

normalize_path() {
    local path=$1
    local platform=$(detect_platform)
    
    case $platform in
        "windows")
            # Convert Windows paths
            echo "$path" | sed 's|\\|/|g'
            ;;
        *)
            echo "$path"
            ;;
    esac
}

cross_platform_copy() {
    local source=$1
    local target=$2
    local platform=$(detect_platform)
    
    case $platform in
        "windows")
            # Use robocopy on Windows if available, fallback to cp
            if command -v robocopy &> /dev/null; then
                robocopy "$source" "$target" /E /NFL /NDL /NJH /NJS
            else
                cp -r "$source"/* "$target/"
            fi
            ;;
        *)
            cp -r "$source"/* "$target/"
            ;;
    esac
}
```

## Performance Optimizations

### Incremental Publishing

```bash
#!/bin/bash
# incremental-publish.sh - Only publish changed files

incremental_publish() {
    local source_dir=$1
    local repo_url=$2
    local target_path=$3
    local state_file=".publish-state"
    
    local temp_dir=$(mktemp -d)
    
    # Clone repository
    git clone "$repo_url" "$temp_dir" || return 1
    
    # Calculate current state
    local current_state=$(find "$source_dir" -type f -exec stat -c "%n:%Y" {} \; | sort | md5sum | cut -d' ' -f1)
    
    # Check if state changed
    if [[ -f "$state_file" ]]; then
        local last_state=$(cat "$state_file")
        if [[ "$current_state" == "$last_state" ]]; then
            echo "📝 No changes detected, skipping publish"
            rm -rf "$temp_dir"
            return 0
        fi
    fi
    
    # Find changed files
    local changed_files=()
    if [[ -f "$state_file.files" ]]; then
        while IFS= read -r file_state; do
            local file_path=$(echo "$file_state" | cut -d: -f1)
            local file_time=$(echo "$file_state" | cut -d: -f2)
            local current_time=$(stat -c "%Y" "$file_path" 2>/dev/null || echo "0")
            
            if [[ "$current_time" != "$file_time" ]]; then
                changed_files+=("$file_path")
            fi
        done < "$state_file.files"
    else
        # First run - all files are "changed"
        while IFS= read -r file; do
            changed_files+=("$file")
        done < <(find "$source_dir" -type f)
    fi
    
    if [[ ${#changed_files[@]} -eq 0 ]]; then
        echo "📝 No file changes detected"
        rm -rf "$temp_dir"
        return 0
    fi
    
    echo "🔄 Publishing ${#changed_files[@]} changed files..."
    
    # Copy only changed files
    for file in "${changed_files[@]}"; do
        local relative_path=${file#$source_dir/}
        local target_file="$temp_dir/$target_path/$relative_path"
        
        mkdir -p "$(dirname "$target_file")"
        cp "$file" "$target_file"
    done
    
    # Commit and push
    cd "$temp_dir"
    git add -A
    
    if ! git diff --staged --quiet; then
        git commit -m "Incremental publish: ${#changed_files[@]} files updated"
        git push
        
        # Update state
        echo "$current_state" > "../$state_file"
        find "$source_dir" -type f -exec stat -c "%n:%Y" {} \; | sort > "../$state_file.files"
        
        echo "✅ Incremental publish completed"
    fi
    
    cd - > /dev/null
    rm -rf "$temp_dir"
}
```

## Conclusion

These advanced workflows demonstrate how lightweight publishing can scale from simple one-liners to sophisticated content pipelines while maintaining the core principle of requiring no permanent setup or heavy tooling.

The key is to start simple and add complexity only when needed, always keeping the solutions portable and self-contained. 