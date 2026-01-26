
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingStep from './components/LoadingStep';
import AuthStep from './components/AuthStep';
import LandingPage from './components/LandingPage';
import { supabaseService } from './services/supabaseService';
import { roleService } from './services/roleService';
import { storageService } from './services/storageService';

// Simplified App component that mostly handles Landing and Auth
// The quiz and other steps are now handled by dedicated routes.

const App: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'landing' | 'auth'>('landing');
  const [user, setUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  const lastUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      const currentUser = await supabaseService.getUser();
      setUser(currentUser);
      lastUserIdRef.current = currentUser?.id || null;
      setIsInitializing(false);
    };

    initializeApp();

    const { data: { subscription } } = supabaseService.onAuthStateChange((newUser) => {
      const oldUserId = lastUserIdRef.current;
      const newUserId = newUser?.id || null;

      // Only clear if user actually changed (e.g. logout or switch account)
      // We don't clear on initial login (null -> id) to preserve quiz answers
      if (oldUserId !== null && oldUserId !== newUserId) {
        console.log('[App] Account changed or logout detected, clearing progress storage...', { oldUserId, newUserId });
        storageService.clearProgress();
        roleService.clearCache();
      }

      lastUserIdRef.current = newUserId;
      setUser(newUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    roleService.clearCache();
    storageService.clearProgress();
    await supabaseService.signOut();
  };

  const refreshRoles = async (currentUser: any | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsSubscriber(false);
      return;
    }

    const [adminStatus, subscriberStatus] = await Promise.all([
      roleService.isAdmin(),
      roleService.isSubscriber()
    ]);

    setIsAdmin(adminStatus);
    setIsSubscriber(subscriberStatus);
  };

  useEffect(() => {
    refreshRoles(user);
  }, [user]);

  const handleOpenAdmin = () => {
    navigate('/admin');
  };

  const handleOpenSubscriberArea = () => {
    navigate('/dashboard');
  };

  if (isInitializing) return <LoadingStep text="Carregando..." />;

  // Auth is still "internal" to the Landing flow if we want, or we can make it a route too.
  // For now, let's keep it simple: if 'auth' step, show Auth, otherwise Landing.

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <AuthStep onLogin={() => {
          setStep('landing');
        }} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center selection:bg-teal-500 selection:text-white`}>
      <main className={`w-full transition-all duration-500`}>
        <LandingPage
          onStart={() => setStep('auth')}
          onLogin={() => setStep('auth')}
          onLogout={handleLogout}
          user={user}
          onStartDiscovery={() => navigate('/quiz')}
          onStartExploration={() => {
            if (!user) {
              setStep('auth');
            } else {
              navigate('/explorar-carreiras');
            }
          }}
          onOpenCatalog={() => navigate('/catalog')}
          onViewMyCareers={handleOpenSubscriberArea}
          isAdmin={isAdmin}
          isSubscriber={isSubscriber}
          onOpenAdmin={handleOpenAdmin}
          onOpenCVAnalyzer={() => navigate('/cv-analyzer')}
          // onLoadPlan is mostly legacy for landing, but if we have it, we could nav to /plano?
          // Actually LandingPage uses it for... ?
          // Let's keep it empty or simple nav if needed.
          onLoadPlan={(plan, title, desc) => navigate('/plano')}
        />
      </main>
    </div>
  );
};

export default App;
