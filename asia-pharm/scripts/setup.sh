#!/bin/bash

# Asia Farm - Automated Setup Script
# This script helps automate the deployment process

set -e

echo "🚀 Asia Farm - Automated Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js installed$(node --version)${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm installed $(npm --version)${NC}"
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ git installed$(git --version)${NC}"
    
    echo ""
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
}

# Setup environment variables
setup_env() {
    echo -e "${BLUE}Setting up environment variables...${NC}"
    
    if [ ! -f .env.local ]; then
        cp .env.example .env.local
        echo -e "${YELLOW}⚠️  .env.local created from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please update .env.local with your actual values${NC}"
    else
        echo -e "${GREEN}✅ .env.local already exists${NC}"
    fi
    echo ""
}

# Install Supabase CLI
install_supabase_cli() {
    echo -e "${BLUE}Checking Supabase CLI...${NC}"
    
    if ! command -v supabase &> /dev/null; then
        echo -e "${YELLOW}Installing Supabase CLI...${NC}"
        npm install -g supabase
        echo -e "${GREEN}✅ Supabase CLI installed${NC}"
    else
        echo -e "${GREEN}✅ Supabase CLI already installed${NC}"
    fi
    echo ""
}

# Install Vercel CLI
install_vercel_cli() {
    echo -e "${BLUE}Checking Vercel CLI...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
        echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    else
        echo -e "${GREEN}✅ Vercel CLI already installed${NC}"
    fi
    echo ""
}

# Link Supabase project
link_supabase() {
    echo -e "${BLUE}Linking Supabase project...${NC}"
    echo -e "${YELLOW}You will need to login to Supabase${NC}"
    
    read -p "Do you want to link Supabase project now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase login
        supabase link --project-ref hohhzspiylssmgdivajk
        echo -e "${GREEN}✅ Supabase project linked${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped Supabase linking${NC}"
    fi
    echo ""
}

# Deploy Supabase migrations
deploy_migrations() {
    echo -e "${BLUE}Deploying database migrations...${NC}"
    
    read -p "Do you want to deploy migrations now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Please run migrations manually in Supabase SQL Editor${NC}"
        echo -e "${YELLOW}File: /supabase/migrations/20250123_initial_schema.sql${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped migrations${NC}"
    fi
    echo ""
}

# Link Vercel project
link_vercel() {
    echo -e "${BLUE}Linking Vercel project...${NC}"
    
    read -p "Do you want to link Vercel project now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel login
        vercel link
        echo -e "${GREEN}✅ Vercel project linked${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped Vercel linking${NC}"
    fi
    echo ""
}

# Setup GitHub secrets
setup_github_secrets() {
    echo -e "${BLUE}Setting up GitHub Secrets...${NC}"
    echo -e "${YELLOW}Please add the following secrets to your GitHub repository:${NC}"
    echo -e "Repository: ${BLUE}https://github.com/ilyairgsha-boop/asia-farm/settings/secrets/actions${NC}"
    echo ""
    echo -e "Required secrets:"
    echo -e "  - SUPABASE_ANON_KEY"
    echo -e "  - SUPABASE_ACCESS_TOKEN"
    echo -e "  - VERCEL_TOKEN"
    echo -e "  - VERCEL_ORG_ID"
    echo -e "  - VERCEL_PROJECT_ID"
    echo ""
    read -p "Press enter when done..."
    echo ""
}

# Final summary
show_summary() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✨ Setup Complete!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "1. Update ${YELLOW}.env.local${NC} with your actual values"
    echo -e "2. Run migrations in Supabase SQL Editor"
    echo -e "3. Configure GitHub Secrets"
    echo -e "4. Push to main branch to trigger deployment"
    echo ""
    echo -e "Local development:"
    echo -e "  ${BLUE}npm run dev${NC}  - Start development server"
    echo -e "  ${BLUE}npm run build${NC} - Build for production"
    echo ""
    echo -e "Documentation:"
    echo -e "  ${BLUE}/DEPLOYMENT_GUIDE.md${NC} - Full deployment guide"
    echo -e "  ${BLUE}/TROUBLESHOOTING.md${NC} - Troubleshooting guide"
    echo ""
}

# Main execution
main() {
    check_requirements
    install_dependencies
    setup_env
    install_supabase_cli
    install_vercel_cli
    link_supabase
    deploy_migrations
    link_vercel
    setup_github_secrets
    show_summary
}

# Run main function
main
