#!/usr/bin/env python
"""
Script to generate self-signed SSL certificates for local HTTPS development.
Run this script before starting the Flask application with HTTPS.
"""

import os
from OpenSSL import crypto

def generate_self_signed_cert(cert_file="cert.pem", key_file="key.pem"):
    """
    Generate a self-signed certificate and key pair for HTTPS.
    
    Args:
        cert_file (str): Path to save the certificate file
        key_file (str): Path to save the key file
    """
    # Create a key pair
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)
    
    # Create a self-signed cert
    cert = crypto.X509()
    cert.get_subject().C = "US"
    cert.get_subject().ST = "State"
    cert.get_subject().L = "City"
    cert.get_subject().O = "Organization"
    cert.get_subject().OU = "Organizational Unit"
    cert.get_subject().CN = "localhost"
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(10*365*24*60*60)  # 10 years
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(k)
    cert.sign(k, 'sha256')
    
    # Save the certificate and key to files
    with open(cert_file, "wb") as f:
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
    
    with open(key_file, "wb") as f:
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, k))
    
    print(f"Self-signed certificate generated:")
    print(f"Certificate: {os.path.abspath(cert_file)}")
    print(f"Private Key: {os.path.abspath(key_file)}")
    print("\nNote: Since this is a self-signed certificate, your browser will show a security warning.")
    print("You can proceed by accepting the risk or adding an exception for this certificate.")

if __name__ == "__main__":
    # Create certs directory if it doesn't exist
    os.makedirs("certs", exist_ok=True)
    
    # Generate the certificate and key in the certs directory
    generate_self_signed_cert(
        cert_file="certs/cert.pem",
        key_file="certs/key.pem"
    )
