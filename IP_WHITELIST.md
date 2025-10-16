# IP Whitelist Configuration

This application uses IP-based access control to restrict access to authorized users only.

## How It Works

The `middleware.js` file checks the IP address of every incoming request. If the IP is not in the whitelist, users are redirected to a 403 Forbidden page.

## Managing the Whitelist

To add or remove IP addresses from the whitelist:

1. Open `middleware.js`
2. Find the `WHITELISTED_IPS` array at the top of the file
3. Add or remove IP addresses as needed

```javascript
const WHITELISTED_IPS = [
  "213.214.40.251", // Office IP
  "::1", // localhost IPv6
  "127.0.0.1", // localhost IPv4
  // Add more IPs here
];
```

## Finding Your IP Address

To find your current IP address, you can:

- Visit https://whatismyipaddress.com/
- Use the command line: `curl ifconfig.me`
- Check your router/network settings

## Development

During local development, localhost IPs (`127.0.0.1` and `::1`) are whitelisted by default.

## Production Deployment

When deploying to production, make sure to:

1. Update the whitelist with your production IP addresses
2. Test access from whitelisted and non-whitelisted locations
3. Note: If using a service like Vercel, the IP detection uses the `x-forwarded-for` header

## Important Notes

- The middleware protects all routes except static assets (images, fonts, etc.)
- Users from non-whitelisted IPs will see a custom 403 error page
- Make sure to keep at least one working IP in the whitelist to avoid locking yourself out
