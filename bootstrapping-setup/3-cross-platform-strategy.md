# 3. Cross-Platform Strategy

## The Multi-OS Challenge

Modern developers often work across multiple operating systems. You might have:
- A **MacBook** for daily development
- An **Ubuntu** server for deployment
- A **Windows** machine with **WSL2** for specific projects
- **Cloud instances** running various Linux distributions

The goal is to have a **consistent development experience** regardless of the underlying platform.

## Platform-Specific Considerations

### macOS: The Developer Default

**Strengths:**
- ✅ Excellent hardware and display quality
- ✅ Unix-based with great GUI applications
- ✅ Strong development tooling ecosystem
- ✅ Good Docker and container support

**Challenges:**
- ❌ Expensive hardware
- ❌ Different package management (Homebrew)
- ❌ Some Linux-specific tools don't work
- ❌ Apple Silicon compatibility issues

**Strategy:**
```bash
# Use Nix for CLI tools (cross-platform)
# Use Homebrew for macOS-specific GUI apps
# Use system frameworks when beneficial
```

### Ubuntu/Linux: The Server Reality

**Strengths:**
- ✅ Native development environment for servers
- ✅ Excellent package management with apt
- ✅ Strong container and virtualization support
- ✅ Cost-effective hardware options

**Challenges:**
- ❌ GUI application ecosystem less mature
- ❌ Different desktop environments
- ❌ Hardware compatibility varies
- ❌ Some proprietary tools unavailable

**Strategy:**
```bash
# Leverage native package managers for system components
# Use Nix for development tools
# Embrace command-line workflows
```

### WSL2: Best of Both Worlds

**Strengths:**
- ✅ Linux development environment on Windows
- ✅ Access to Windows applications
- ✅ Good performance with WSL2
- ✅ Integration with VS Code

**Challenges:**
- ❌ File system performance across boundaries
- ❌ Networking complexity
- ❌ GPU access limitations
- ❌ Memory usage overhead

**Strategy:**
```bash
# Keep development files in WSL filesystem
# Use Windows for GUI applications
# Careful with cross-filesystem operations
```

## Unified Package Management Strategy

### The Three-Tier Approach

```
┌─────────────────────────────────────────────┐
│ Tier 1: Nix (Cross-platform CLI tools)     │
│ git, nodejs, python, rust, modern-cli      │
├─────────────────────────────────────────────┤
│ Tier 2: Platform Package Manager           │
│ macOS: Homebrew  │ Linux: apt  │ WSL: apt  │
├─────────────────────────────────────────────┤
│ Tier 3: System-specific Tools              │
│ Platform integrations and GUI applications │
└─────────────────────────────────────────────┘
```

### Implementation with chezmoi Templates

**Platform Detection**
```yaml
# .chezmoi.yaml.tmpl
{{- $os := .chezmoi.os -}}
{{- $arch := .chezmoi.arch -}}
{{- $hostname := .chezmoi.hostname -}}

data:
  os: {{ $os }}
  arch: {{ $arch }}
  hostname: {{ $hostname }}
  is_wsl: {{ eq $os "linux" and (stat "/proc/version" | regexMatch "microsoft") }}
  is_server: {{ not (or (eq $os "darwin") .is_wsl) }}
```

**Conditional Package Installation**
```bash
# run_onchange_install-packages.sh.tmpl
#!/bin/bash

{{- if eq .chezmoi.os "darwin" }}
# macOS: Use Homebrew for GUI apps
if ! command -v brew &> /dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew bundle --file=- <<EOF
tap "homebrew/cask"
cask "visual-studio-code"
cask "google-chrome" 
cask "docker"
cask "1password"
cask "rectangle"
EOF
{{- end }}

{{- if eq .chezmoi.os "linux" }}
# Linux: Use system package manager
sudo apt update
sudo apt install -y \
    build-essential \
    curl \
    wget \
    unzip
    
{{- if .is_wsl }}
# WSL-specific packages
sudo apt install -y \
    wslu \
    ubuntu-wsl
{{- end }}
{{- end }}

# Universal: Install Nix packages
if command -v nix-env &> /dev/null; then
    nix-env -iA nixpkgs.git
    nix-env -iA nixpkgs.nodejs
    nix-env -iA nixpkgs.python3
    nix-env -iA nixpkgs.ripgrep
    nix-env -iA nixpkgs.fzf
    nix-env -iA nixpkgs.eza
    nix-env -iA nixpkgs.bat
fi
```

## Configuration Adaptation Patterns

### Shell Configuration

**Fish Shell with Platform Adaptations**
```fish
# dot_config/fish/config.fish.tmpl
# Universal settings
set -x EDITOR {{ if eq .chezmoi.os "darwin" }}code{{ else }}vim{{ end }}
set -x LANG en_US.UTF-8

{{- if eq .chezmoi.os "darwin" }}
# macOS specific
set -x BROWSER open
fish_add_path /opt/homebrew/bin
fish_add_path /opt/homebrew/sbin

# macOS aliases
alias finder="open ."
alias preview="open -a Preview"
{{- end }}

{{- if eq .chezmoi.os "linux" }}
# Linux specific
set -x BROWSER xdg-open
fish_add_path ~/.local/bin

{{- if .is_wsl }}
# WSL specific
alias explorer="explorer.exe ."
alias code="code.exe"
set -x BROWSER wslview
{{- end }}
{{- end }}

# Universal aliases (using Nix-installed tools)
alias ls="eza --icons"
alias ll="eza -la --icons"
alias cat="bat"
alias grep="rg"
alias find="fd"
```

### Git Configuration

**Platform-Aware Git Setup**
```toml
# dot_gitconfig.tmpl
[user]
    name = {{ .git.name }}
    email = {{ .git.email }}

[core]
    editor = {{ if eq .chezmoi.os "darwin" }}code --wait{{ else }}vim{{ end }}
    autocrlf = {{ if eq .chezmoi.os "windows" }}true{{ else }}input{{ end }}

{{- if eq .chezmoi.os "darwin" }}
[credential]
    helper = osxkeychain
{{- else if .is_wsl }}
[credential]
    helper = /mnt/c/Program\ Files/Git/mingw64/libexec/git-core/git-credential-manager-core.exe
{{- else }}
[credential]
    helper = store
{{- end }}

[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    
{{- if eq .chezmoi.os "darwin" }}
    # macOS: Use system open
    browse = !open $(git remote get-url origin)
{{- else }}
    # Linux: Use xdg-open or wslview
    browse = !{{ if .is_wsl }}wslview{{ else }}xdg-open{{ end }} $(git remote get-url origin)
{{- end }}
```

### Development Environment Variables

**Environment Setup with Platform Logic**
```bash
# dot_profile.tmpl
# Universal environment variables
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

{{- if eq .chezmoi.os "darwin" }}
# macOS paths
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
export PATH="/usr/local/bin:$PATH"

# macOS specific variables
export BROWSER="open"
export HOMEBREW_NO_ANALYTICS=1
{{- end }}

{{- if eq .chezmoi.os "linux" }}
# Linux paths
export PATH="$HOME/.local/bin:$PATH"

{{- if .is_wsl }}
# WSL specific
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0
export BROWSER="wslview"
{{- else }}
# Native Linux
export BROWSER="xdg-open"
{{- end }}
{{- end }}

# Nix integration (universal)
if [ -e $HOME/.nix-profile/etc/profile.d/nix.sh ]; then
    . $HOME/.nix-profile/etc/profile.d/nix.sh
fi
```

## Application-Specific Adaptations

### VS Code Settings

**Cross-Platform VS Code Configuration**
```json
// dot_config/Code/User/settings.json.tmpl
{
    "editor.fontFamily": "{{ .font.code }}",
    "editor.fontSize": 14,
    
    {{- if eq .chezmoi.os "darwin" }}
    "terminal.integrated.defaultProfile.osx": "fish",
    "terminal.integrated.profiles.osx": {
        "fish": {
            "path": "/opt/homebrew/bin/fish"
        }
    },
    {{- else if eq .chezmoi.os "linux" }}
    "terminal.integrated.defaultProfile.linux": "fish",
    "terminal.integrated.profiles.linux": {
        "fish": {
            "path": "/usr/bin/fish"
        }
    },
    {{- end }}
    
    "files.watcherExclude": {
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/node_modules/*/**": true,
        {{- if .is_wsl }}
        "**/mnt/**": true
        {{- end }}
    },
    
    {{- if .is_wsl }}
    "remote.WSL.fileWatcher.polling": true,
    {{- end }}
    
    "workbench.colorTheme": "{{ .theme.editor }}"
}
```

### SSH Configuration

**Platform-Aware SSH Setup**
```ssh
# dot_ssh/config.tmpl
Host *
    AddKeysToAgent yes
    {{- if eq .chezmoi.os "darwin" }}
    UseKeychain yes
    {{- end }}
    IdentityFile ~/.ssh/id_ed25519

{{- if .is_wsl }}
# WSL: Use Windows SSH agent
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
{{- end }}

# Development servers
Host dev-server
    HostName {{ .dev.server_ip }}
    User {{ .dev.username }}
    Port 22
    {{- if eq .chezmoi.os "darwin" }}
    UseKeychain yes
    {{- end }}
```

## Performance Considerations

### File System Optimization

**WSL2 Performance Tips**
```bash
# For WSL2 users - keep source code in Linux filesystem
# Bad (slow): /mnt/c/Users/username/projects
# Good (fast): /home/username/projects

{{- if .is_wsl }}
# Create symlink for easy access from Windows
if [ ! -L "/mnt/c/Users/$(whoami)/wsl-projects" ]; then
    ln -s "$HOME/projects" "/mnt/c/Users/$(whoami)/wsl-projects"
fi
{{- end }}
```

**macOS Specific Optimizations**
```bash
{{- if eq .chezmoi.os "darwin" }}
# Disable .DS_Store files on network volumes
defaults write com.apple.desktopservices DSDontWriteNetworkStores true

# Faster key repeat
defaults write -g InitialKeyRepeat -int 10
defaults write -g KeyRepeat -int 1
{{- end }}
```

### Shell Performance

**Conditional Feature Loading**
```fish
# dot_config/fish/config.fish.tmpl
# Only load features if available on this platform

{{- if eq .chezmoi.os "darwin" }}
# macOS: Load Homebrew completions
if test -d /opt/homebrew/share/fish/completions
    set -p fish_complete_path /opt/homebrew/share/fish/completions
end
{{- end }}

# Load Node.js manager only if Node projects exist
function __load_nvm --on-variable PWD
    if test -f package.json -o -f .nvmrc
        if not command -v nvm > /dev/null
            # Load appropriate Node version manager
            {{- if eq .chezmoi.os "darwin" }}
            [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && source "/opt/homebrew/opt/nvm/nvm.sh"
            {{- else }}
            [ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
            {{- end }}
        end
        
        if test -f .nvmrc
            nvm use
        end
    end
end
```

## Testing Across Platforms

### Automated Testing Strategy

**Docker-based Testing**
```yaml
# .github/workflows/test-platforms.yml
name: Test Across Platforms

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        platform:
          - ubuntu-latest
          - macos-latest
          - windows-latest
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Nix
        uses: cachix/install-nix-action@v17
        if: matrix.platform != 'windows-latest'
        
      - name: Setup WSL (Windows)
        uses: Vampire/setup-wsl@v1
        if: matrix.platform == 'windows-latest'
        with:
          distribution: Ubuntu-20.04
          
      - name: Test dotfiles installation
        run: |
          chmod +x install.sh
          ./install.sh --dry-run
```

**Local Testing with Docker**
```bash
# Test Ubuntu environment
docker run -it --rm \
  -v "$PWD:/dotfiles" \
  ubuntu:latest \
  bash -c "cd /dotfiles && ./install.sh"

# Test different architectures
docker run --platform linux/arm64 -it --rm \
  -v "$PWD:/dotfiles" \
  ubuntu:latest \
  bash -c "cd /dotfiles && ./install.sh"
```

## Migration Strategies

### Moving Between Platforms

**Export Current Configuration**
```bash
# Generate platform-specific export
chezmoi data | jq '.chezmoi.os' > current-platform.txt

# Export installed packages
case "$(uname -s)" in
    Darwin*)
        brew bundle dump --describe
        ;;
    Linux*)
        dpkg --get-selections > installed-packages.txt
        ;;
esac
```

**Platform Migration Script**
```bash
#!/bin/bash
# migrate-platform.sh

OLD_PLATFORM="$1"
NEW_PLATFORM="$2"

echo "Migrating from $OLD_PLATFORM to $NEW_PLATFORM..."

# Update chezmoi configuration
chezmoi edit-config

# Re-run platform-specific installation
chezmoi apply --verbose

echo "Migration complete! Please restart your shell."
```

## Best Practices Summary

### Do's ✅

1. **Use Nix for CLI tools** - Maximum cross-platform compatibility
2. **Embrace platform strengths** - GUI apps via native package managers
3. **Template everything** - Make configurations conditional
4. **Test on all platforms** - Use CI/CD to catch issues early
5. **Document platform differences** - Help team members understand

### Don'ts ❌

1. **Don't assume Unix everywhere** - Windows behavior is different
2. **Don't hardcode paths** - Use variables and detection
3. **Don't ignore performance** - Some operations are slow cross-platform
4. **Don't copy blindly** - Understand why configurations differ
5. **Don't forget mobile** - Consider iOS/Android development needs

The cross-platform strategy enables seamless development across any operating system while embracing each platform's unique strengths. In the next chapter, we'll dive into the package management philosophy that makes this all possible. 