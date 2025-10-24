#!/bin/bash

# Copy Edge Function files to correct directory structure
# Asia Pharm - Supabase Edge Function Setup

echo "Creating make-server-a75b5353 directory..."
mkdir -p supabase/functions/make-server-a75b5353

echo "Copying index.tsx to index.ts and updating imports..."
sed 's/kv_store\.tsx/kv_store.ts/g' supabase/functions/server/index.tsx > supabase/functions/make-server-a75b5353/index.ts

echo "Copying kv_store.tsx to kv_store.ts and updating project ref..."
sed 's/datoomsnmfuodecpbmpn/hohhzspiylssmgdivajk/g' supabase/functions/server/kv_store.tsx > supabase/functions/make-server-a75b5353/kv_store.ts

echo "✅ Edge Function files copied successfully!"
echo ""
echo "Structure:"
echo "  supabase/functions/make-server-a75b5353/"
echo "    ├── index.ts"
echo "    └── kv_store.ts"
echo ""
echo "Ready to deploy:"
echo "  supabase functions deploy make-server-a75b5353 --no-verify-jwt"
