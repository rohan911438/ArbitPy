# Vercel Deployment README

## 🚀 Deploy to Vercel

This project is configured for easy deployment to Vercel with both frontend and backend support.

### 📋 Prerequisites

1. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
2. **Git Repository**: Project must be in a Git repository
3. **Environment Variables**: Configure the variables listed below

### 🔧 Environment Variables

Copy the values from `env.vercel` to your Vercel dashboard:

#### Frontend Variables
```
VITE_CONTRACT_ADDRESS=0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56
VITE_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
VITE_NETWORK_ID=421614
VITE_APP_NAME=ArbitPy Playground
VITE_API_URL=https://your-domain.vercel.app
```

#### Backend Variables
```
CONTRACT_ADDRESS=0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NETWORK_ID=421614
GEMINI_API_KEY=AIzaSyBInWubdwFk4QPpXCsvlH2NfhMDNBsmVo8
NODE_ENV=production
```

### 📱 One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rohan911438/arbitpy-playground&env=VITE_CONTRACT_ADDRESS,VITE_ARBITRUM_SEPOLIA_RPC,VITE_NETWORK_ID,GEMINI_API_KEY&project-name=arbitpy-playground&repository-name=arbitpy-playground)

### 🛠️ Manual Deployment

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

3. **Configure Domain**
   - Set `VITE_API_URL` to your Vercel app URL
   - Update frontend to use production API

### 🔍 Deployment Configuration

The project includes:
- ✅ `vercel.json` - Build and routing configuration
- ✅ `env.vercel` - Environment variables template
- ✅ Static file optimization
- ✅ API routes configuration
- ✅ SPA routing support

### 📊 Contract Information

**Deployed Contract on Arbitrum Sepolia:**
- **Address**: `0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56`
- **Explorer**: [View on Arbiscan](https://sepolia.arbiscan.io/address/0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56)
- **Network**: Arbitrum Sepolia Testnet
- **Chain ID**: 421614

### 🚨 Important Notes

1. **Environment Variables**: Must be set in Vercel dashboard
2. **API Routes**: Backend runs as serverless functions
3. **Build Process**: Vite builds frontend to `dist/` directory
4. **Domains**: Update `VITE_API_URL` after deployment
5. **CORS**: Configure for your domain in backend

### 🔧 Post-Deployment

1. **Test Deployment**: Verify all features work
2. **Update URLs**: Update any hardcoded localhost URLs
3. **Monitor**: Check Vercel dashboard for errors
4. **Analytics**: Configure Vercel Analytics if needed

### 📞 Support

- **Issues**: Create issue on GitHub
- **Documentation**: Check main README.md
- **Vercel Help**: [Vercel Docs](https://vercel.com/docs)