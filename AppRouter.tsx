
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import App from './App';
import { SubscriberDashboard } from './components/SubscriberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CatalogStep } from './components/CatalogStep';
import { ResumeBuilder } from './components/ResumeBuilder';
import { supabaseService } from './services/supabaseService';
import { roleService } from './services/roleService';
import { CVImportPage } from './pages/CVImportPage';
import ExploreCareersStep from './components/ExploreCareersStep';
import { CareerComparator } from './components/CareerComparator';
import { CVEditorStep } from './components/CVEditorStep';

// New Pages
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { FinalPlanPage } from './pages/FinalPlanPage';
import { PlanTrackerPage } from './pages/PlanTrackerPage';

// Protected Route Component
const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    requireSubscriber?: boolean;
    requireAdmin?: boolean;
}> = ({ children, requireSubscriber, requireAdmin }) => {
    const [isChecking, setIsChecking] = React.useState(true);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);

            if (!currentUser) {
                setIsAuthorized(false);
                setIsChecking(false);
                return;
            }

            if (requireSubscriber) {
                const isSubscriber = await roleService.isSubscriber();
                setIsAuthorized(isSubscriber);
            } else if (requireAdmin) {
                const isAdmin = await roleService.isAdmin();
                setIsAuthorized(isAdmin);
            } else {
                setIsAuthorized(true);
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [requireSubscriber, requireAdmin]);

    if (isChecking) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-teal-400">Verificando permissões...</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// Wrapper components to handle navigation
const DashboardWrapper: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState<any>(null);
    const [isAdmin, setIsAdmin] = React.useState(false);

    React.useEffect(() => {
        const loadUser = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
            const adminStatus = await roleService.isAdmin();
            setIsAdmin(adminStatus);
        };
        loadUser();
    }, []);

    const handleLogout = async () => {
        roleService.clearCache();
        await supabaseService.signOut();
        navigate('/');
    };

    if (!user) return null;

    return (
        <SubscriberDashboard
            user={user}
            onLogout={handleLogout}
            onLoadPlan={() => { }}
            onNewTest={() => navigate('/quiz')}
            onOpenCatalog={() => navigate('/catalog', { state: { from: '/dashboard' } })}
            onStartExploration={() => navigate('/explorar-carreiras', { state: { from: '/dashboard' } })}
            onBack={() => navigate('/')}
            isAdmin={isAdmin}
            onOpenAdmin={() => navigate('/admin')}
            onOpenCVAnalyzer={() => navigate('/cv-analyzer', { state: { from: '/dashboard' } })}
        />
    );
};

const AdminWrapper: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const loadUser = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    const handleLogout = async () => {
        roleService.clearCache();
        await supabaseService.signOut();
        navigate('/');
    };

    if (!user) return null;

    return (
        <AdminDashboard
            user={user}
            onLogout={handleLogout}
            onGoHome={() => navigate('/dashboard')}
            onViewLanding={() => navigate('/')}
        />
    );
};

const CVAnalyzerWrapper: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const loadUser = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    if (!user) return null;

    return (
        <CVEditorStep
            analysis={undefined}
            userId={user.id}
            onBack={() => navigate(location.state?.from || '/')}
        />
    );
};

const CatalogWrapper: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const loadUser = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    return (
        <CatalogStep
            onBack={() => navigate(location.state?.from || '/')}
        />
    );
};

const CVImportWrapper: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const loadUser = async () => {
            const currentUser = await supabaseService.getUser();
            setUser(currentUser);
        };
        loadUser();
    }, []);

    if (!user) return null;

    return <CVImportPage />;
};

const ExploreCareersWrapper: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const backPath = location.state?.from || '/';

    return <ExploreCareersStep onBack={() => navigate(backPath)} />;
};

const CareerComparatorWrapper: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return <CareerComparator onBack={() => navigate(location.state?.from || '/dashboard')} />;
};

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* New Refactored Routes */}
                <Route path="/quiz" element={<QuizPage />} />
                <Route path="/resultados" element={<ResultsPage />} />
                <Route path="/plano" element={<FinalPlanPage />} />

                <Route
                    path="/acompanhamento/:planId"
                    element={
                        <ProtectedRoute requireSubscriber>
                            <PlanTrackerPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/acompanhamento"
                    element={
                        <ProtectedRoute requireSubscriber>
                            <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                    }
                />

                {/* Subscriber Dashboard Route */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requireSubscriber>
                            <DashboardWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Dashboard Route */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* CV Analyzer Route */}
                <Route
                    path="/cv-analyzer"
                    element={
                        <ProtectedRoute>
                            <CVAnalyzerWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* Catalog Route */}
                <Route path="/catalog" element={<CatalogWrapper />} />

                {/* Resume Builder Route */}
                <Route path="/resume-builder" element={<ResumeBuilder />} />

                {/* CV Import Route */}
                <Route
                    path="/curriculo"
                    element={
                        <ProtectedRoute>
                            <CVImportWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* Explore Careers Route */}
                <Route
                    path="/explorar-carreiras"
                    element={
                        <ProtectedRoute>
                            <ExploreCareersWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* Career Comparator Route */}
                <Route
                    path="/comparar"
                    element={
                        <ProtectedRoute>
                            <CareerComparatorWrapper />
                        </ProtectedRoute>
                    }
                />

                {/* Main App Route - Landing, Auth, Questions, etc - MUST BE LAST */}
                <Route path="/" element={<App />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
