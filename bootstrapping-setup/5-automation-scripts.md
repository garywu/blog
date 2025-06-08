# 5. Automation & Scripts

## The Philosophy of Zero-Touch Setup

The ultimate goal is a single command that transforms a fresh machine into a fully configured development environment. This requires thoughtful orchestration of multiple tools and careful error handling.

## Bootstrap Script Architecture

### The Master Installation Script

```bash
#!/bin/bash
# install.sh - Complete development environment bootstrap

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# === Configuration ===
DOTFILES_REPO="https://github.com/yourusername/dotfiles.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/dotfiles-install.log"

# === Logging Functions ===
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $*" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $*" | tee -a "$LOG_FILE"
}

# === OS Detection ===
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            if [[ "$(uname -m)" == "arm64" ]]; then
                echo "macos-arm64"
            else
                echo "macos-intel"
            fi
            ;;
        Linux*)
            if grep -q "microsoft" /proc/version 2>/dev/null; then
                echo "wsl2"
            elif grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
                echo "ubuntu"
            elif grep -q "Debian" /etc/os-release 2>/dev/null; then
                echo "debian"
            else
                echo "linux"
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# === Prerequisites Check ===
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for required tools
    command -v curl >/dev/null || missing_tools+=("curl")
    command -v git >/dev/null || missing_tools+=("git")
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Please install: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check internet connectivity
    if ! curl -sSf https://httpbin.org/status/200 >/dev/null 2>&1; then
        log_error "No internet connection detected"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# === Nix Installation ===
install_nix() {
    if command -v nix >/dev/null 2>&1; then
        log_info "Nix already installed"
        return 0
    fi
    
    log_info "Installing Nix package manager..."
    
    case "$OS" in
        macos-*)
            # macOS installation
            sh <(curl -L https://nixos.org/nix/install) --daemon
            ;;
        ubuntu|debian|wsl2)
            # Linux installation
            sh <(curl -L https://nixos.org/nix/install) --daemon
            ;;
        *)
            log_error "Unsupported OS for Nix installation: $OS"
            exit 1
            ;;
    esac
    
    # Source Nix environment
    if [[ -e '/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh' ]]; then
        source '/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh'
    fi
    
    # Verify installation
    if command -v nix >/dev/null 2>&1; then
        log_success "Nix installed successfully"
    else
        log_error "Nix installation failed"
        exit 1
    fi
}

# === Platform-Specific Setup ===
install_platform_packages() {
    log_info "Installing platform-specific packages for $OS..."
    
    case "$OS" in
        macos-*)
            install_homebrew
            install_macos_packages
            ;;
        ubuntu|debian)
            install_ubuntu_packages
            ;;
        wsl2)
            install_wsl2_packages
            ;;
    esac
}

install_homebrew() {
    if command -v brew >/dev/null 2>&1; then
        log_info "Homebrew already installed"
        return 0
    fi
    
    log_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH
    case "$OS" in
        macos-arm64)
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
            ;;
        macos-intel)
            echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/usr/local/bin/brew shellenv)"
            ;;
    esac
    
    log_success "Homebrew installed successfully"
}

install_macos_packages() {
    log_info "Installing macOS packages via Homebrew..."
    
    # Essential GUI applications
    local casks=(
        "visual-studio-code"
        "google-chrome"
        "docker"
        "1password"
        "rectangle"
        "raycast"
    )
    
    for cask in "${casks[@]}"; do
        if ! brew list --cask "$cask" >/dev/null 2>&1; then
            log_info "Installing $cask..."
            brew install --cask "$cask"
        else
            log_info "$cask already installed"
        fi
    done
    
    # Development fonts
    brew tap homebrew/cask-fonts
    brew install --cask font-fira-code-nerd-font
    
    log_success "macOS packages installed"
}

install_ubuntu_packages() {
    log_info "Installing Ubuntu system packages..."
    
    # Update package list
    sudo apt update
    
    # Essential system packages
    local packages=(
        "build-essential"
        "curl"
        "wget"
        "git"
        "unzip"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
    )
    
    sudo apt install -y "${packages[@]}"
    
    log_success "Ubuntu packages installed"
}

install_wsl2_packages() {
    log_info "Installing WSL2-specific packages..."
    
    # Install Ubuntu packages first
    install_ubuntu_packages
    
    # WSL2-specific packages
    sudo apt install -y wslu ubuntu-wsl
    
    log_success "WSL2 packages installed"
}

# === Dotfiles Setup ===
setup_dotfiles() {
    log_info "Setting up dotfiles with chezmoi..."
    
    # Install chezmoi via Nix
    nix-env -iA nixpkgs.chezmoi
    
    # Initialize dotfiles
    if [[ ! -d "$HOME/.local/share/chezmoi" ]]; then
        log_info "Initializing dotfiles repository..."
        chezmoi init "$DOTFILES_REPO"
    else
        log_info "Dotfiles repository already initialized"
    fi
    
    # Apply dotfiles
    log_info "Applying dotfiles configuration..."
    chezmoi apply --verbose
    
    log_success "Dotfiles setup complete"
}

# === Development Environment Setup ===
setup_development_environment() {
    log_info "Setting up development environment..."
    
    # Install Home Manager if home.nix exists
    if [[ -f "$HOME/.config/home-manager/home.nix" ]] || [[ -f "$HOME/.local/share/chezmoi/dot_config/home-manager/home.nix" ]]; then
        install_home_manager
    fi
    
    # Setup language environments
    setup_node_environment
    setup_python_environment
    setup_rust_environment
    
    log_success "Development environment setup complete"
}

install_home_manager() {
    log_info "Installing Nix Home Manager..."
    
    # Add Home Manager channel
    nix-channel --add https://github.com/nix-community/home-manager/archive/master.tar.gz home-manager
    nix-channel --update
    
    # Install Home Manager
    nix-shell '<home-manager>' -A install
    
    # Apply Home Manager configuration
    home-manager switch
    
    log_success "Home Manager installed and configured"
}

setup_node_environment() {
    log_info "Setting up Node.js environment..."
    
    # Install Node.js via Nix (already in home.nix)
    # Install global packages
    if command -v npm >/dev/null 2>&1; then
        npm install -g \
            yarn \
            pnpm \
            typescript \
            eslint \
            prettier \
            nodemon
    fi
    
    log_success "Node.js environment ready"
}

setup_python_environment() {
    log_info "Setting up Python environment..."
    
    # Python is installed via Nix
    # Install common global packages
    if command -v pip3 >/dev/null 2>&1; then
        pip3 install --user \
            virtualenv \
            pipenv \
            black \
            flake8 \
            mypy
    fi
    
    log_success "Python environment ready"
}

setup_rust_environment() {
    log_info "Setting up Rust environment..."
    
    # Rust is installed via Nix
    # Additional Rust tools
    if command -v cargo >/dev/null 2>&1; then
        cargo install \
            cargo-edit \
            cargo-watch \
            cargo-audit
    fi
    
    log_success "Rust environment ready"
}

# === Post-Installation Setup ===
post_installation_setup() {
    log_info "Running post-installation setup..."
    
    # Generate SSH key if it doesn't exist
    if [[ ! -f "$HOME/.ssh/id_ed25519" ]]; then
        log_info "Generating SSH key..."
        ssh-keygen -t ed25519 -C "$(git config user.email)" -f "$HOME/.ssh/id_ed25519" -N ""
        log_info "SSH key generated: $HOME/.ssh/id_ed25519.pub"
        log_warning "Don't forget to add your SSH key to GitHub/GitLab"
    fi
    
    # Setup shell integration
    setup_shell_integration
    
    # Create common directories
    mkdir -p "$HOME/Projects"
    mkdir -p "$HOME/Documents/Scripts"
    
    log_success "Post-installation setup complete"
}

setup_shell_integration() {
    log_info "Setting up shell integration..."
    
    # Add Nix to shell profile if not already there
    local shell_profile
    case "$SHELL" in
        */fish)
            shell_profile="$HOME/.config/fish/config.fish"
            ;;
        */zsh)
            shell_profile="$HOME/.zshrc"
            ;;
        */bash)
            shell_profile="$HOME/.bashrc"
            ;;
        *)
            shell_profile="$HOME/.profile"
            ;;
    esac
    
    # Ensure Nix is in PATH
    if [[ -f "$shell_profile" ]] && ! grep -q "nix-profile" "$shell_profile"; then
        echo 'export PATH="$HOME/.nix-profile/bin:$PATH"' >> "$shell_profile"
    fi
    
    log_success "Shell integration configured"
}

# === Cleanup and Verification ===
cleanup_and_verify() {
    log_info "Running cleanup and verification..."
    
    # Clean up temporary files
    case "$OS" in
        macos-*)
            brew cleanup
            ;;
        ubuntu|debian|wsl2)
            sudo apt autoremove -y
            sudo apt autoclean
            ;;
    esac
    
    # Verify installations
    verify_installation
    
    log_success "Cleanup and verification complete"
}

verify_installation() {
    log_info "Verifying installation..."
    
    local errors=0
    
    # Check essential tools
    local tools=(
        "git" "Git version control"
        "nix" "Nix package manager"
        "chezmoi" "Dotfiles manager"
    )
    
    for ((i=0; i<${#tools[@]}; i+=2)); do
        local tool="${tools[i]}"
        local description="${tools[i+1]}"
        
        if command -v "$tool" >/dev/null 2>&1; then
            log_success "$description: ✓"
        else
            log_error "$description: ✗"
            ((errors++))
        fi
    done
    
    # Check platform-specific tools
    case "$OS" in
        macos-*)
            if command -v brew >/dev/null 2>&1; then
                log_success "Homebrew: ✓"
            else
                log_error "Homebrew: ✗"
                ((errors++))
            fi
            ;;
    esac
    
    if [[ $errors -eq 0 ]]; then
        log_success "All verifications passed!"
    else
        log_error "$errors verification(s) failed"
        return 1
    fi
}

# === Help and Usage ===
show_help() {
    cat << EOF
Development Environment Bootstrap Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --help              Show this help message
    --dry-run           Show what would be done without executing
    --skip-packages     Skip platform package installation
    --skip-dotfiles     Skip dotfiles setup
    --verbose           Enable verbose output

EXAMPLES:
    $0                  # Full installation
    $0 --dry-run        # See what would be installed
    $0 --skip-packages  # Only setup dotfiles

ENVIRONMENT VARIABLES:
    DOTFILES_REPO       Custom dotfiles repository URL
    NIX_CHANNEL         Custom Nix channel (default: nixpkgs)

EOF
}

# === Main Execution ===
main() {
    # Parse command line arguments
    local dry_run=false
    local skip_packages=false
    local skip_dotfiles=false
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --skip-packages)
                skip_packages=true
                shift
                ;;
            --skip-dotfiles)
                skip_dotfiles=true
                shift
                ;;
            --verbose)
                verbose=true
                set -x
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Banner
    cat << 'EOF'
┌─────────────────────────────────────────────┐
│   Development Environment Bootstrap        │
│   Setting up your perfect dev environment  │
└─────────────────────────────────────────────┘
EOF
    
    # Detect operating system
    OS=$(detect_os)
    log_info "Detected OS: $OS"
    
    if [[ "$dry_run" == true ]]; then
        log_warning "DRY RUN MODE - No changes will be made"
        log_info "Would install packages for: $OS"
        log_info "Would setup dotfiles from: $DOTFILES_REPO"
        exit 0
    fi
    
    # Create log file
    touch "$LOG_FILE"
    log_info "Starting installation... (Log: $LOG_FILE)"
    
    # Execute installation steps
    check_prerequisites
    install_nix
    
    if [[ "$skip_packages" != true ]]; then
        install_platform_packages
    fi
    
    if [[ "$skip_dotfiles" != true ]]; then
        setup_dotfiles
    fi
    
    setup_development_environment
    post_installation_setup
    cleanup_and_verify
    
    # Success message
    cat << 'EOF'

🎉 Installation Complete!

Your development environment is now ready. Here's what was installed:
✓ Nix package manager with modern CLI tools
✓ Platform-specific packages and applications
✓ Dotfiles configuration with chezmoi
✓ Development languages and tools
✓ Shell integration and aliases

Next steps:
1. Restart your terminal or run: source ~/.bashrc
2. Add your SSH key to GitHub: cat ~/.ssh/id_ed25519.pub
3. Start developing! 🚀

EOF
    
    log_success "Bootstrap complete! Enjoy your new development environment."
}

# Execute main function with all arguments
main "$@"
```

This automation framework provides a complete, maintainable solution for setting up development environments across different platforms with proper error handling and user feedback. 