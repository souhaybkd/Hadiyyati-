DNS records for domain verification of hadiyyati.me on Resend

Add the following DNS records at your domain provider for hadiyyati.me:

DKIM
  Type: TXT
  Name: resend._domainkey
  Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDrWe8BOb8yFmJdmOInVvZ9AtPhplmaaJbIieUwVv6A9aOZsVleLrRP5C4XPTIfyUuxl2c+ApyVxC5d2koOiGhsLYXUZv3YUmNqn/rXBeA99HnEif456yC9v5VGAUJuPap/3CyfdfLKax3rnx9gDKVOF+oB0eywJXevX07XOehg2wIDAQAB
  TTL: Auto

SPF
  Type: CNAME
  Name: rsend
  Value: rsend-apne1.forge.rmta.net
  TTL: Auto

  Type: CNAME
  Name: send
  Value: send.forge.rmta.net
  TTL: Auto

DMARC (recommended)
  Type: TXT
  Name: _dmarc
  Value: v=DMARC1; p=none;
  TTL: Auto

After adding these records, return to Resend to verify.
Docs: https://resend.com/docs/dashboard/domains/introduction