let
  desktop = [
    ./core
    ./network
    ./misc

    ./services/ananicy.nix
    ./services/gnome-services.nix
    # ./services/greetd.nix
    ./services/pipewire.nix
    ./services/gdm.nix

    # Hardware
    ./hardware/bluetooth.nix
    ./hardware/opentablet.nix

    # Desktop Environments
    ./desktop-environments/plasma.nix
  ];
in {
  inherit desktop;
}
