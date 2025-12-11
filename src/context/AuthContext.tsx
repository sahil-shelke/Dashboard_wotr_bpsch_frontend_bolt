import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  language: string;
  setLanguage: (value: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('en'); // Default language
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sessionId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('session_id='));

      const languageCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('language='));
    if (languageCookie) {
      const langValue = languageCookie.split('=')[1];
      setLanguage(langValue);
    } else {
      // Set default language if cookie is not found
      setLanguage('en');
    }
    const isUnprotectedRoute =
      location.pathname === '/register' || location.pathname === '/verify-otp';

    if (isUnprotectedRoute) {
      setIsLoggedIn(false);
    } else {
      if (sessionId) {
        setIsLoggedIn(true);
        navigate('/');

      } else {
        setIsLoggedIn(false);
        navigate('/login');
      }
    }
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, language, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
