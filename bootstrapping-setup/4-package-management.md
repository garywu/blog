# 4. Package Management Philosophy

## The Multi-Manager Reality

Modern development requires tools from different ecosystems. No single package manager can handle everything efficiently, so we need a strategic approach to combining multiple package managers while maintaining simplicity and consistency.

## The Nix-First Strategy

### Why Nix as the Primary Manager?

**Nix's Unique Advantages:**
- ✅ **Reproducible**: Exact same versions across all machines
- ✅ **Atomic**: Upgrades never break existing setups
- ✅ **Cross-platform**: Same packages on macOS, Linux, WSL2
- ✅ **Rollback-able**: Easy to undo problematic changes
- ✅ **No conflicts**: Multiple versions can coexist
- ✅ **Declarative**: Describe what you want, not how to get it

**Real-world Example:**
```nix
# nix/home.nix - Your development environment as code
{ pkgs, ... }: {
  home.packages = with pkgs; [
    # Modern CLI tools
    eza              # Better ls
    bat              # Better cat  
    fd               # Better find
    ripgrep          # Better grep
    fzf              # Fuzzy finder
    delta            # Better git diff
    dust             # Better du
    tokei            # Code statistics
    
    # Development tools
    git
    gh               # GitHub CLI
    nodejs           # Latest Node.js
    python3          # Latest Python
    rustc            # Rust compiler
    go               # Go compiler
    
    # System utilities
    htop             # Process monitor
    curl             # HTTP client
    wget             # Download tool
    jq               # JSON processor
    yq               # YAML processor
    tree             # Directory tree
    
    # Terminal multiplexer
    tmux             # Terminal sessions
    zellij           # Modern terminal workspace
  ];
}
```

### Nix Package Categories

**Category 1: CLI Development Tools**
```nix
developmentTools = with pkgs; [
  # Version control
  git
  gh
  git-lfs
  
  # Programming languages
  nodejs
  python3
  rustc
  cargo
  go
  
  # Database tools
  postgresql
  redis
  sqlite
  
  # Container tools
  docker-compose
  kubectl
  helm
];
```

**Category 2: Modern CLI Replacements**
```nix
modernCLI = with pkgs; [
  # File operations
  eza      # ls replacement
  bat      # cat replacement
  fd       # find replacement
  ripgrep  # grep replacement
  
  # System monitoring
  htop     # top replacement
  bottom   # htop alternative
  dust     # du replacement
  
  # Network tools
  bandwhich # bandwidth monitor
  dog       # dig replacement
];
```

**Category 3: Development Utilities**
```nix
utilities = with pkgs; [
  # Text processing
  jq       # JSON processor
  yq       # YAML processor
  csvkit   # CSV tools
  
  # File compression
  unzip
  p7zip
  
  # Network utilities
  curl
  wget
  httpie
  
  # Terminal tools
  fzf      # Fuzzy finder
  starship # Shell prompt
  direnv   # Environment loader
];
```

## Platform-Specific Package Managers

### macOS: Homebrew for GUI Applications

**Why keep Homebrew on macOS?**
- 🍺 **GUI applications**: Best way to install Mac apps
- 🍺 **System integration**: Works well with macOS conventions
- 🍺 **Mature ecosystem**: Extensive cask library
- 🍺 **Community support**: Active maintenance

**Homebrew Strategy:**
```ruby
# Brewfile - GUI applications only
tap "homebrew/cask"
tap "homebrew/cask-fonts"

# Essential GUI applications
cask "visual-studio-code"
cask "google-chrome"
cask "firefox"
cask "docker"
cask "1password"

# Communication
cask "slack"
cask "discord"
cask "zoom"

# Productivity
cask "rectangle"        # Window management
cask "raycast"          # Spotlight replacement
cask "cleanmymac"       # System maintenance

# Development GUI tools  
cask "insomnia"         # API client
cask "tableplus"        # Database client
cask "sourcetree"       # Git GUI

# Fonts for development
cask "font-fira-code-nerd-font"
cask "font-jetbrains-mono-nerd-font"
```

**chezmoi Integration:**
```yaml
# .chezmoi.yaml.tmpl
{{- if eq .chezmoi.os "darwin" }}
data:
  homebrew:
    install: true
    casks:
      - visual-studio-code
      - google-chrome
      - docker
      - 1password
      - rectangle
{{- end }}
```

### Linux: System Packages for Foundation

**Ubuntu/Debian Strategy:**
```bash
# System-level packages that Nix shouldn't handle
system_packages=(
    # Build essentials
    build-essential
    gcc
    make
    
    # System libraries
    libssl-dev
    libffi-dev
    libsqlite3-dev
    
    # Hardware support
    firmware-linux
    bluetooth
    
    # Desktop environment (if GUI)
    gnome-shell
    gnome-terminal
    
    # System services
    systemd
    dbus
)

sudo apt update
sudo apt install -y "${system_packages[@]}"
```

**Package Categories by Manager:**
```
┌─────────────────────────────────────────────┐
│                   System                    │
│ apt: build-essential, libs, drivers, DE    │
├─────────────────────────────────────────────┤
│                Development                  │
│ Nix: languages, tools, CLI utilities       │
├─────────────────────────────────────────────┤
│                Applications                 │
│ Flatpak/Snap: GUI applications             │
└─────────────────────────────────────────────┘
```

### Windows/WSL2: Hybrid Approach

**WSL2 Package Strategy:**
```bash
# Inside WSL2: Use same Linux strategy
# Host Windows: Use winget or Chocolatey for Windows apps

# WSL2 development packages (via Nix)
nix-env -iA nixpkgs.git
nix-env -iA nixpkgs.nodejs
nix-env -iA nixpkgs.python3

# Windows host applications (via winget)
winget install Microsoft.VisualStudioCode
winget install Google.Chrome
winget install Docker.DockerDesktop
```

## Implementation Patterns

### Home Manager Configuration

**Complete home.nix Example:**
```nix
{ config, pkgs, ... }:

{
  # Basic configuration
  home.username = "yourusername";
  home.homeDirectory = "/Users/yourusername";  # macOS
  # home.homeDirectory = "/home/yourusername";   # Linux
  
  # Package installation
  home.packages = with pkgs; [
    # === Core Development Tools ===
    git
    gh
    nodejs
    python3
    rustc
    cargo
    go
    
    # === Modern CLI Tools ===
    eza
    bat
    fd
    ripgrep
    fzf
    delta
    dust
    tokei
    
    # === System Utilities ===
    htop
    curl
    wget
    jq
    yq
    tree
    unzip
    
    # === Development Utilities ===
    docker-compose
    kubectl
    terraform
    awscli2
    
    # === Terminal Enhancement ===
    starship
    tmux
    direnv
  ];
  
  # Program-specific configurations
  programs = {
    # Git configuration
    git = {
      enable = true;
      userName = "Your Name";
      userEmail = "your.email@example.com";
      extraConfig = {
        init.defaultBranch = "main";
        pull.rebase = false;
        core.editor = "code --wait";
      };
    };
    
    # Fish shell configuration
    fish = {
      enable = true;
      interactiveShellInit = ''
        # Set environment variables
        set -x EDITOR code
        set -x LANG en_US.UTF-8
        
        # Modern CLI aliases
        alias ls="eza --icons"
        alias ll="eza -la --icons"
        alias cat="bat"
        alias grep="rg"
        alias find="fd"
      '';
    };
    
    # Starship prompt
    starship = {
      enable = true;
      enableFishIntegration = true;
    };
    
    # FZF fuzzy finder
    fzf = {
      enable = true;
      enableFishIntegration = true;
    };
    
    # Direnv for environment management
    direnv = {
      enable = true;
      enableFishIntegration = true;
    };
  };
  
  # Version compatibility
  home.stateVersion = "23.05";
}
```

### Package Update Workflows

**Automated Update Script:**
```bash
#!/bin/bash
# scripts/update-packages.sh

set -e

echo "🔄 Updating development environment packages..."

# Detect operating system
OS="$(uname -s)"

# Update Nix packages
if command -v home-manager &> /dev/null; then
    echo "🏠 Updating Nix Home Manager packages..."
    home-manager switch
elif command -v nix-env &> /dev/null; then
    echo "📦 Updating Nix packages..."
    nix-channel --update
    nix-env -u
fi

# Update platform-specific packages
case "$OS" in
    Darwin*)
        if command -v brew &> /dev/null; then
            echo "🍺 Updating Homebrew packages..."
            brew update
            brew upgrade
            brew cleanup
        fi
        ;;
    Linux*)
        echo "🐧 Updating system packages..."
        if command -v apt &> /dev/null; then
            sudo apt update
            sudo apt upgrade -y
            sudo apt autoremove -y
        elif command -v dnf &> /dev/null; then
            sudo dnf upgrade -y
        fi
        ;;
esac

# Update language-specific package managers
if command -v npm &> /dev/null; then
    echo "📱 Updating global npm packages..."
    npm update -g
fi

if command -v pip3 &> /dev/null; then
    echo "🐍 Updating global pip packages..."
    pip3 list --outdated --format=freeze | cut -d = -f 1 | xargs -n1 pip3 install -U
fi

echo "✅ Package updates complete!"
```

### Version Pinning Strategy

**Nix Package Pinning:**
```nix
# For critical packages, pin specific versions
{ pkgs, ... }:

let
  # Pin Node.js to specific version
  nodejs-16 = pkgs.nodejs-16_x;
  
  # Pin Python to specific version  
  python39 = pkgs.python39;
  
  # Use specific package from older nixpkgs
  oldPkgs = import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/nixos-22.05.tar.gz";
    sha256 = "sha256-example";
  }) {};
  
in {
  home.packages = [
    nodejs-16        # Pinned Node.js
    python39         # Pinned Python
    oldPkgs.someOldPackage  # Package from older nixpkgs
    
    # Latest packages
    pkgs.git
    pkgs.ripgrep
    pkgs.fzf
  ];
}
```

## Language-Specific Package Management

### Node.js Ecosystem

**Strategy: Use Nix for Node.js runtime, npm for project dependencies**
```nix
# Install Node.js via Nix
home.packages = [ pkgs.nodejs ];

# Global tools via npm (in shell configuration)
npm install -g \
  yarn \
  pnpm \
  typescript \
  @vue/cli \
  create-react-app \
  nodemon
```

### Python Environment

**Strategy: Use Nix for Python runtime, virtual environments for projects**
```nix
# Install Python and pip via Nix
home.packages = with pkgs; [
  python3
  python3Packages.pip
  python3Packages.virtualenv
  poetry  # Modern dependency management
];

# Project-specific dependencies via requirements.txt or pyproject.toml
```

### Rust Development

**Strategy: Use Nix for Rust toolchain, Cargo for dependencies**
```nix
# Rust development environment
home.packages = with pkgs; [
  rustc
  cargo
  rustfmt
  rust-analyzer
  clippy
];

# Project dependencies managed by Cargo.toml
```

## Package Discovery and Management

### Finding Packages

**Nix Package Search:**
```bash
# Search for packages
nix search nixpkgs nodejs
nix search nixpkgs python

# Browse packages online
# https://search.nixos.org/packages
```

**Package Information:**
```bash
# Get package information
nix-env -qa 'nodejs.*'
nix-env -qI  # List installed packages

# Package details
nix show-derivation nixpkgs.nodejs
```

### Package Testing

**Test Packages Before Installing:**
```bash
# Try package temporarily
nix shell nixpkgs#nodejs

# Test in clean environment
nix shell nixpkgs#nodejs nixpkgs#python3 --command bash

# Run one-off commands
nix run nixpkgs#nodejs -- --version
```

## Troubleshooting Common Issues

### Nix Installation Problems

**macOS Catalina+ Volume Issues:**
```bash
# If Nix installation fails on macOS
sudo diskutil apfs addVolume disk1 APFSX Nix -mountpoint /nix
sudo diskutil enableOwnership /nix
sudo chflags hidden /nix  # Hide from Finder

# Verify installation
nix --version
```

**Linux Permission Issues:**
```bash
# Fix Nix daemon permissions
sudo systemctl enable nix-daemon
sudo systemctl start nix-daemon

# Add user to nix-users group
sudo usermod -a -G nix-users $USER
```

### Package Conflicts

**Resolving Conflicts Between Managers:**
```bash
# Check PATH order
echo $PATH

# Nix should come first for CLI tools
export PATH="$HOME/.nix-profile/bin:$PATH"

# Platform packages for GUI/system only
# Example: Use Nix git, not Homebrew git
```

**Multiple Python Versions:**
```bash
# List Python installations
which -a python3

# Use Nix Python by default
/home/user/.nix-profile/bin/python3

# Create project-specific environments
python3 -m venv myproject
source myproject/bin/activate
```

## Best Practices Summary

### Package Manager Responsibilities

| Manager | Responsibility | Examples |
|---------|----------------|----------|
| **Nix** | CLI tools, dev runtimes | git, nodejs, python, rust |
| **Homebrew** | macOS GUI apps | VS Code, Chrome, Docker |
| **apt/dnf** | System libraries, drivers | build-essential, ssl-dev |
| **npm/pip/cargo** | Project dependencies | Express, Django, Serde |
| **Flatpak/Snap** | Linux GUI apps | Spotify, Discord |

### Golden Rules

1. **Nix first for CLI tools** - Maximum portability and reproducibility
2. **Platform managers for GUI** - Better system integration
3. **Project managers for dependencies** - Language ecosystem best practices
4. **Pin critical versions** - Avoid breaking changes
5. **Regular updates** - Security and feature updates
6. **Test in isolation** - Use nix shell for testing
7. **Document decisions** - Help future you and team members

In the next chapter, we'll explore automation scripts that tie all these package managers together seamlessly. 