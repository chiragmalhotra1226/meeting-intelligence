import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Explicitly load the local .env file
print("🔄 Loading environment variables from .env...")
load_dotenv()

# Extract keys
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
jwt_secret = os.getenv("JWT_SECRET")

print("\n📋 Environment Configuration Summary:")
print(f"  • SUPABASE_URL:          {supabase_url}")
print(f"  • SUPABASE_ANON_KEY:     {supabase_anon_key[:20] if supabase_anon_key else None}...")
print(f"  • SUPABASE_SERVICE_KEY:  {supabase_service_key[:20] if supabase_service_key else None}...")
print(f"  • JWT_SECRET:            {'Configured ✅' if jwt_secret else 'Missing ❌'}")

if not all([supabase_url, supabase_anon_key, supabase_service_key]):
    print("\n❌ Error: One or more critical Supabase keys are completely missing from your .env file.")
    exit(1)

# ── Test 1: Public Connection (Anon Key) ─────────────────────────────
print("\n🧪 Test 1: Initializing Client with ANON PUBLIC KEY...")
try:
    supabase_anon: Client = create_client(supabase_url, supabase_anon_key)
    # Attempt a simple unauthenticated ping to database auth health checks
    auth_health = supabase_anon.auth.get_session()
    print("✅ Success: Public Client initialized smoothly!")
except Exception as e:
    print(f"❌ Test 1 Failed: Could not initialize or authenticate public client.")
    print(f"   Details: {str(e)}")

# ── Test 2: Admin Connection (Service Role Key) ──────────────────────
print("\n🧪 Test 2: Initializing Client with SERVICE ROLE SECRET KEY...")
try:
    supabase_admin: Client = create_client(supabase_url, supabase_service_key)
    print("✅ Success: Admin Client initialized smoothly!")
    
    # Attempt a test query to list your buckets to confirm database admin access
    print("🔄 Testing Storage bucket read permissions via admin client...")
    buckets = supabase_admin.storage.list_buckets()
    print(f"✅ Success: Connected to Database! Found {len(buckets)} storage buckets.")
    for b in buckets:
        print(f"    - Bucket Name: {b.name} (Public: {b.public})")
        
except Exception as e:
    print(f"❌ Test 2 Failed: Storage read check rejected.")
    print("   This usually means your SUPABASE_SERVICE_KEY is invalid or copied incorrectly.")
    print(f"   Details: {str(e)}")

print("\n🏁 Debug configuration testing complete.")