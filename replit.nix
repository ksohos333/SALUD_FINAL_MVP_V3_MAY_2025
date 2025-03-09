{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.flask
    pkgs.python311Packages.python-dotenv
    pkgs.python311Packages.requests
    pkgs.python311Packages.pyopenssl
    pkgs.python311Packages.openai
    pkgs.python311Packages.flask-cors
    pkgs.python311Packages.pytest
    pkgs.python311Packages.pytz
  ];
}
