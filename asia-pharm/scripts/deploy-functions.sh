#!/bin/bash

# Script to deploy Supabase Edge Functions

set -e

echo "🚀 Asia Farm - Deploy Edge Functions"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID="hohhzspiylssmgdivajk"
FUNCTION_NAME="make-server-a75b5353"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo -e "${YELLOW}Install with: npm install -g supabase${NC}"
    exit 1
fi

echo -e "${BLUE}Checking login status...${NC}"
supabase projects list &> /dev/null || supabase login

echo -e "${BLUE}Deploying function: ${FUNCTION_NAME}${NC}"
echo ""

# Deploy function
supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_ID

echo ""
echo -e "${GREEN}✅ Edge Function deployed successfully!${NC}"
echo ""
echo -e "Function URL:"
echo -e "${BLUE}https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}/${NC}"
echo ""
echo -e "Test the function:"
echo -e "${BLUE}curl https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}/${NC}"
echo ""
