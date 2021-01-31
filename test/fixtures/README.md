# Directory of testing fixtures

## To create fake certificates

```shell
# Create a fake CA cert (with key and cert in the same file)
openssl req -x509 -new \
  -subj "/CN=Fake CA" \
  -days 3650 \
  -newkey rsa:2048 -nodes \
  -keyout ca.pem -out ca.pem

# Create CSR
openssl req -new \
  -subj "/CN=localhost" \
  -days 3650 \
  -newkey rsa:2048 -nodes \
  -keyout key.pem -out csr.pem

# Sign the CSR to generate a certificate (with additional SubjectAltNames)
openssl x509 -req \
  -in csr.pem \
  -CA ca.pem -CAcreateserial \
  -extensions SAN \
  -extfile <(cat /etc/ssl/openssl.cnf \
    <(printf "\n[SAN]\nsubjectAltName=DNS:localhost,IP:127.0.0.1")) \
  -days 3650 -sha256 \
  -out cert.pem

# Cleanup
rm ca.srl csr.pem
```
