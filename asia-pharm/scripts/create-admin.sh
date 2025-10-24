#!/bin/bash

# Script to create admin user in Asia Farm

set -e

echo "🔐 Asia Farm - Create Admin User"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Prompt for email
read -p "Enter admin email: " ADMIN_EMAIL

if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}❌ Email is required${NC}"
    exit 1
fi

# Create SQL command
SQL_COMMAND="UPDATE public.profiles SET is_admin = TRUE WHERE email = '$ADMIN_EMAIL';"

echo ""
echo -e "${BLUE}SQL Command:${NC}"
echo "$SQL_COMMAND"
echo ""
echo -e "${YELLOW}Options to execute:${NC}"
echo ""
echo "1. Execute in Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/editor"
echo ""
echo "2. Or copy this command and execute manually"
echo ""

# Check if supabase CLI is installed
if command -v supabase &> /dev/null; then
    read -p "Execute now with Supabase CLI? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Executing...${NC}"
        echo "$SQL_COMMAND" | supabase db execute --project-ref hohhzspiylssmgdivajk
        echo -e "${GREEN}✅ Admin user created successfully!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Please execute manually.${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
