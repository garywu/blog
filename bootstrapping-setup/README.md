# Modern Development Environment Bootstrapping

A comprehensive guide to setting up reproducible, cross-platform development environments using modern tools and best practices.

## 📖 Table of Contents

1. [Evolution of Development Setup](./1-evolution-of-setup.md)
2. [Modern Architecture](./2-modern-architecture.md)
3. [Cross-Platform Strategy](./3-cross-platform-strategy.md)
4. [Package Management Philosophy](./4-package-management.md)
5. [Automation & Scripts](./5-automation-scripts.md)
6. [Secrets & Environment Management](./6-secrets-environment.md)

## 🎯 What You'll Learn

- **Modern package management** with Nix and platform-specific managers
- **Cross-platform development** setup for macOS, Linux, and WSL2
- **Dotfiles management** with chezmoi for configuration as code
- **Secrets management** with SOPS and encrypted storage
- **Automation strategies** for zero-touch environment setup
- **Best practices** for maintainable and shareable configurations

## 🚀 Quick Start

Want to see it in action? Check out the [modern architecture](./2-modern-architecture.md) chapter for the complete setup overview.

## 💡 Philosophy

This guide follows these principles:

- **Reproducible**: Same environment across machines and team members
- **Cross-platform**: Works on macOS, Ubuntu, and WSL2
- **Maintainable**: Easy to update and modify configurations
- **Minimal setup**: One-command installation for new machines
- **No vendor lock-in**: Uses open-source, portable solutions

## 🔧 Technologies Covered

### Package Managers
- **Nix** - Reproducible, cross-platform CLI tools
- **Homebrew** - macOS GUI applications and system tools
- **apt** - Ubuntu/Debian system packages

### Configuration Management
- **chezmoi** - Dotfiles and configuration as code
- **Home Manager** - Declarative user environment management
- **Starship** - Cross-shell prompt configuration

### Secrets & Security
- **SOPS** - Encrypted secrets in Git repositories
- **age** - Modern encryption for secrets
- **direnv** - Directory-specific environment variables

### Development Tools
- **Fish Shell** - Modern shell with intelligent features
- **Modern CLI tools** - eza, bat, fd, ripgrep, fzf, and more
- **Version managers** - Node.js, Python, Ruby environments

## 🎯 Target Audience

This guide is perfect for:

- **Developers** setting up new machines frequently
- **Teams** wanting consistent development environments
- **DevOps engineers** managing multiple system configurations
- **Students** learning modern development practices
- **Anyone** tired of manual environment setup

## 📊 Approach Comparison

| Traditional | Modern (This Guide) |
|-------------|-------------------|
| Manual installation | Automated bootstrap |
| Platform-specific | Cross-platform |
| Imperative setup | Declarative config |
| Scattered configs | Centralized management |
| Manual updates | Automated maintenance |
| No versioning | Version-controlled |

## 🏁 Getting Started

1. **Read the evolution** - Understand how we got here
2. **Study the architecture** - See the complete modern setup
3. **Choose your platform** - Follow OS-specific guidance
4. **Implement gradually** - Start with basics, add complexity
5. **Customize for your needs** - Adapt patterns to your workflow

## 🤝 Contributing

Found improvements or have additional patterns to share? This guide evolves with the community's needs and experiences.

---

*This guide represents years of experience setting up development environments across different platforms, teams, and use cases.* 