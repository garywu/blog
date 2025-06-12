{
  description = "AI pipeline dev environment for metadata extraction";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        python = pkgs.python311.withPackages (ps: [
          ps.requests
          ps.setuptools
        ]);
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [ python pkgs.python311Full pkgs.python311Packages.pip ];
          shellHook = ''
            echo "Welcome to the AI pipeline dev environment!"
            echo "Python: $(python --version)"
            pip install --no-cache-dir dspy==2.6.27 || exit 1
            echo "DSPy: $(python -c 'import dspy; print(dspy.__version__)' 2>/dev/null || echo 'not installed')"
            echo "requests: $(python -c 'import requests; print(requests.__version__)' 2>/dev/null || echo 'not installed')"
          '';
        };
      }
    );
} 