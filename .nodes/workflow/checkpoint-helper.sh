#!/bin/bash
# checkpoint-helper.sh - Live blog checkpoint process

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BLOG_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Colors for output
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*"; }
success() { echo -e "${GREEN}✅${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️${NC} $*"; }
error() { echo -e "${RED}❌${NC} $*" >&2; exit 1; }

# Create new live checkpoint
create_checkpoint() {
    local blog_name="$1"
    local blog_dir="$BLOG_ROOT/$blog_name"
    
    # Validate blog exists
    if [[ ! -d "$blog_dir" ]]; then
        error "Blog directory '$blog_name' not found"
    fi
    
    if [[ ! -f "$blog_dir/README.md" ]]; then
        error "README.md not found in '$blog_name'"
    fi
    
    # Create timestamp
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local checkpoint_dir="$blog_dir/checkpoints/$timestamp"
    
    log "🚀 Starting live checkpoint for '$blog_name' at $timestamp..."
    
    # Create checkpoint directory
    mkdir -p "$checkpoint_dir"
    
    # Save current state as "before"
    cp "$blog_dir/README.md" "$checkpoint_dir/before.md"
    
    # Create checkpoint metadata
    cat > "$checkpoint_dir/metadata.json" << EOF
{
  "blog_name": "$blog_name",
  "timestamp": "$timestamp",
  "created_at": "$(date -Iseconds)",
  "status": "active",
  "process_type": "live_refinement",
  "files": {
    "before": "before.md",
    "after": "after.md",
    "chat": "chat.md"
  },
  "git": {
    "initial_commit": "$(cd "$BLOG_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'unknown')"
  }
}
EOF
    
    # Create live chat log
    cat > "$checkpoint_dir/chat.md" << EOF
# Live Checkpoint: $blog_name ($timestamp)

**Status**: 🔄 Active Refinement Process  
**Started**: $(date)  
**Blog**: $blog_name  

## Process Log

### Checkpoint Initialized
- **Before state captured**: $timestamp/before.md ($(wc -l < "$checkpoint_dir/before.md") lines)
- **Live refinement mode**: Active
- **Chat logging**: Enabled

---

## Conversation & Changes

EOF
    
    # Store checkpoint info for later use
    echo "$blog_name:$timestamp" > "$BLOG_ROOT/.active_checkpoint"
    
    success "Live checkpoint activated: $checkpoint_dir"
    echo "📁 Checkpoint ID: $timestamp"
    echo "📝 Before state saved: $(wc -l < "$checkpoint_dir/before.md") lines"
    echo "💬 Live chat log: $checkpoint_dir/chat.md"
    echo "🎯 Ready for iterative refinement!"
    echo ""
    echo "💡 The README.md will be updated live during our conversation"
    echo "💡 All exchanges will be logged automatically to chat.md"
    echo "💡 Say 'checkpoint complete' when ready to finalize"
}

# Log conversation entry to active checkpoint
log_conversation() {
    local message="$1"
    local speaker="${2:-user}"  # user or ai
    local active_checkpoint_file="$BLOG_ROOT/.active_checkpoint"
    
    if [[ ! -f "$active_checkpoint_file" ]]; then
        warn "No active checkpoint found"
        return 1
    fi
    
    local checkpoint_info=$(cat "$active_checkpoint_file")
    local blog_name="${checkpoint_info%:*}"
    local timestamp="${checkpoint_info#*:}"
    local chat_file="$BLOG_ROOT/$blog_name/checkpoints/$timestamp/chat.md"
    
    if [[ ! -f "$chat_file" ]]; then
        error "Chat log not found: $chat_file"
    fi
    
    # Append to chat log
    echo "" >> "$chat_file"
    echo "### $(date +'%H:%M:%S') - $(echo "$speaker" | tr '[:lower:]' '[:upper:]')" >> "$chat_file"
    echo "" >> "$chat_file"
    echo "$message" >> "$chat_file"
    echo "" >> "$chat_file"
    echo "---" >> "$chat_file"
}

# Complete and finalize checkpoint
complete_checkpoint() {
    local blog_name="${1:-}"
    local timestamp="${2:-}"
    local active_checkpoint_file="$BLOG_ROOT/.active_checkpoint"
    
    # If no params provided, try to get from active checkpoint
    if [[ -z "$blog_name" && -f "$active_checkpoint_file" ]]; then
        local checkpoint_info=$(cat "$active_checkpoint_file")
        blog_name="${checkpoint_info%:*}"
        timestamp="${checkpoint_info#*:}"
    fi
    
    if [[ -z "$blog_name" || -z "$timestamp" ]]; then
        error "No active checkpoint found or parameters missing"
    fi
    
    local blog_dir="$BLOG_ROOT/$blog_name"
    local checkpoint_dir="$blog_dir/checkpoints/$timestamp"
    
    # Validate checkpoint exists
    if [[ ! -d "$checkpoint_dir" ]]; then
        error "Checkpoint '$timestamp' not found for blog '$blog_name'"
    fi
    
    log "🏁 Finalizing checkpoint $timestamp for '$blog_name'..."
    
    # Save final state as "after"
    cp "$blog_dir/README.md" "$checkpoint_dir/after.md"
    
    # Update chat log with completion
    cat >> "$checkpoint_dir/chat.md" << EOF

## Checkpoint Finalized
**Completed**: $(date)

### Summary
- **Before**: $(wc -l < "$checkpoint_dir/before.md") lines
- **After**: $(wc -l < "$checkpoint_dir/after.md") lines  
- **Delta**: $(($(wc -l < "$checkpoint_dir/after.md") - $(wc -l < "$checkpoint_dir/before.md"))) lines
- **Changes**: $(diff --brief "$checkpoint_dir/before.md" "$checkpoint_dir/after.md" >/dev/null && echo "No content changes" || echo "Content refined")

### Files Generated
- \`before.md\` - Original blog state  
- \`after.md\` - Final refined version
- \`chat.md\` - Complete conversation log
- \`metadata.json\` - Process metadata

EOF
    
    # Update metadata
    local temp_file=$(mktemp)
    jq --arg final_commit "$(cd "$BLOG_ROOT" && git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
       '.status = "completed" | .completed_at = now | .completed_at_readable = (now | strftime("%Y-%m-%d %H:%M:%S")) | .git.final_commit = $final_commit' \
       "$checkpoint_dir/metadata.json" > "$temp_file"
    mv "$temp_file" "$checkpoint_dir/metadata.json"
    
    # Commit and push changes
    log "📦 Committing and pushing changes..."
    cd "$BLOG_ROOT"
    
    # Add all changes
    git add .
    
    # Create commit message
    local commit_msg="Checkpoint: Refined $blog_name ($timestamp)

- Iterative refinement process completed
- Changes logged in checkpoints/$timestamp/
- Before: $(wc -l < "$checkpoint_dir/before.md") lines → After: $(wc -l < "$checkpoint_dir/after.md") lines"
    
    if git commit -m "$commit_msg"; then
        success "Changes committed successfully"
        
        if git push; then
            success "Changes pushed to remote repository"
        else
            warn "Push failed - you may need to push manually"
        fi
    else
        warn "Nothing to commit - no changes detected"
    fi
    
    # Clean up active checkpoint marker
    rm -f "$active_checkpoint_file"
    
    success "Checkpoint completed: $checkpoint_dir"
    echo "📝 Final state saved: $checkpoint_dir/after.md"
    echo "💬 Complete chat log: $checkpoint_dir/chat.md"
    echo "📊 Process metadata: $checkpoint_dir/metadata.json"
    echo "🚀 Changes committed and pushed to git"
}

# Show active checkpoint status
status() {
    local active_checkpoint_file="$BLOG_ROOT/.active_checkpoint"
    
    if [[ ! -f "$active_checkpoint_file" ]]; then
        echo "❌ No active checkpoint"
        return 0
    fi
    
    local checkpoint_info=$(cat "$active_checkpoint_file")
    local blog_name="${checkpoint_info%:*}"
    local timestamp="${checkpoint_info#*:}"
    local checkpoint_dir="$BLOG_ROOT/$blog_name/checkpoints/$timestamp"
    
    echo "🔄 Active Checkpoint: $blog_name/$timestamp"
    echo ""
    
    if [[ -f "$checkpoint_dir/metadata.json" ]]; then
        local created_at=$(jq -r '.created_at' "$checkpoint_dir/metadata.json" 2>/dev/null)
        echo "📅 Started: $created_at"
    fi
    
    if [[ -f "$checkpoint_dir/chat.md" ]]; then
        local chat_lines=$(wc -l < "$checkpoint_dir/chat.md")
        echo "💬 Chat log: $chat_lines lines"
    fi
    
    local current_lines=$(wc -l < "$BLOG_ROOT/$blog_name/README.md")
    local before_lines=$(wc -l < "$checkpoint_dir/before.md")
    echo "📊 Current: $current_lines lines (started with $before_lines)"
    echo ""
    echo "💡 Use 'complete' to finalize this checkpoint"
}

# List checkpoints for a blog
list_checkpoints() {
    local blog_name="$1"
    local blog_dir="$BLOG_ROOT/$blog_name"
    local checkpoints_dir="$blog_dir/checkpoints"
    
    if [[ ! -d "$checkpoints_dir" ]]; then
        warn "No checkpoints found for '$blog_name'"
        return 0
    fi
    
    echo "📋 Checkpoints for '$blog_name':"
    echo ""
    
    for checkpoint in "$checkpoints_dir"/*; do
        if [[ -d "$checkpoint" ]]; then
            local timestamp=$(basename "$checkpoint")
            local metadata_file="$checkpoint/metadata.json"
            
            if [[ -f "$metadata_file" ]]; then
                local status=$(jq -r '.status' "$metadata_file" 2>/dev/null || echo "unknown")
                local created_at=$(jq -r '.created_at' "$metadata_file" 2>/dev/null || echo "unknown")
                
                case "$status" in
                    "completed")
                        echo "✅ $timestamp - Completed ($created_at)"
                        ;;
                    "active")
                        echo "🔄 $timestamp - Active ($created_at)"
                        ;;
                    *)
                        echo "❓ $timestamp - Status: $status ($created_at)"
                        ;;
                esac
            else
                echo "📁 $timestamp - (no metadata)"
            fi
        fi
    done
    echo ""
}

# Show checkpoint details
show_checkpoint() {
    local blog_name="$1"
    local timestamp="$2"
    local checkpoint_dir="$BLOG_ROOT/$blog_name/checkpoints/$timestamp"
    
    if [[ ! -d "$checkpoint_dir" ]]; then
        error "Checkpoint '$timestamp' not found for blog '$blog_name'"
    fi
    
    echo "📋 Checkpoint Details: $blog_name/$timestamp"
    echo ""
    
    if [[ -f "$checkpoint_dir/metadata.json" ]]; then
        echo "📊 Metadata:"
        jq '.' "$checkpoint_dir/metadata.json"
        echo ""
    fi
    
    echo "📁 Files:"
    ls -la "$checkpoint_dir/"
    echo ""
    
    if [[ -f "$checkpoint_dir/before.md" && -f "$checkpoint_dir/after.md" ]]; then
        echo "📈 Changes Summary:"
        local before_lines=$(wc -l < "$checkpoint_dir/before.md")
        local after_lines=$(wc -l < "$checkpoint_dir/after.md")
        echo "  Before: $before_lines lines"
        echo "  After:  $after_lines lines"
        echo "  Delta:  $((after_lines - before_lines)) lines"
        echo ""
    fi
}

# Usage display
usage() {
    cat << EOF
Usage: $0 COMMAND [BLOG_NAME] [TIMESTAMP]

Live Checkpoint Commands:
    create BLOG_NAME           Start live checkpoint process
    complete [BLOG_NAME] [TIMESTAMP] Finalize active checkpoint (auto-detects if no params)
    status                     Show active checkpoint status
    log "MESSAGE" [SPEAKER]    Add entry to active checkpoint chat log
    
Management Commands:
    list BLOG_NAME            List all checkpoints for blog
    show BLOG_NAME TIMESTAMP  Show checkpoint details

Examples:
    $0 create w-slash-ai                    # Start live refinement
    $0 log "Let's improve the intro"        # Log conversation
    $0 status                               # Check active checkpoint
    $0 complete                             # Finalize and commit
    $0 list w-slash-ai                      # View history

Available blogs: w-slash-ai, git-publish, bootstrapping-setup

EOF
}

# Main execution
main() {
    local command="${1:-}"
    local arg1="${2:-}"
    local arg2="${3:-}"
    
    case "$command" in
        "create")
            [[ -z "$arg1" ]] && { usage; exit 1; }
            create_checkpoint "$arg1"
            ;;
        "complete")
            complete_checkpoint "$arg1" "$arg2"
            ;;
        "status")
            status
            ;;
        "log")
            [[ -z "$arg1" ]] && { usage; exit 1; }
            log_conversation "$arg1" "$arg2"
            ;;
        "list")
            [[ -z "$arg1" ]] && { usage; exit 1; }
            list_checkpoints "$arg1"
            ;;
        "show")
            [[ -z "$arg1" || -z "$arg2" ]] && { usage; exit 1; }
            show_checkpoint "$arg1" "$arg2"
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

main "$@" 