// ============================================
// auth.js — Supabase Client & Google OAuth
// ============================================
const SUPABASE_URL = 'https://lycfedsjonvtpiijpiuc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Y2ZlZHNqb252dHBpaWpwaXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDg5NTIsImV4cCI6MjA5NTQyNDk1Mn0.OpsFZkKPWe3IFuuOPN40CDMgV-XuJhaG979Pr9FP1OY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ——— DOM References ———
const authBar         = document.getElementById('auth-bar');
const btnSignIn       = document.getElementById('btn-sign-in');
const btnSignOut      = document.getElementById('btn-sign-out');
const userInfoEl      = document.getElementById('user-info');
const userAvatarEl    = document.getElementById('user-avatar');
const userNameEl      = document.getElementById('user-name');
const signedOutView   = document.getElementById('signed-out-view');
const signedInView    = document.getElementById('signed-in-view');
const timestampsCard  = document.getElementById('timestamps-card');

// ——— Auth state ———
let currentUser = null;

// ——— Sign In with Google ———
async function signInWithGoogle() {
  btnSignIn.disabled = true;
  btnSignIn.querySelector('.btn-sign-in-text').textContent = 'Signing in…';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  if (error) {
    console.error('Sign-in error:', error.message);
    btnSignIn.disabled = false;
    btnSignIn.querySelector('.btn-sign-in-text').textContent = 'Sign in with Google';
  }
}

// ——— Sign Out ———
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign-out error:', error.message);
  }
}

// ——— Update UI based on auth state ———
function updateAuthUI(user) {
  currentUser = user;

  if (user) {
    // Signed in
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email || 'User';
    const avatar = meta.avatar_url || meta.picture || '';

    userNameEl.textContent = name;
    if (avatar) {
      userAvatarEl.src = avatar;
      userAvatarEl.style.display = 'block';
    } else {
      userAvatarEl.style.display = 'none';
    }

    signedOutView.style.display = 'none';
    signedInView.style.display = 'flex';
    timestampsCard.style.display = 'flex';

    // Load timestamps for this user
    if (typeof loadTimestamps === 'function') {
      loadTimestamps();
    }
  } else {
    // Signed out
    signedOutView.style.display = 'flex';
    signedInView.style.display = 'none';
    timestampsCard.style.display = 'none';
  }
}

// ——— Listen for auth state changes ———
supabase.auth.onAuthStateChange((event, session) => {
  updateAuthUI(session?.user || null);
});

// ——— Initialize: check current session ———
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  updateAuthUI(session?.user || null);
})();

// ——— Event Listeners ———
btnSignIn.addEventListener('click', signInWithGoogle);
btnSignOut.addEventListener('click', signOut);
