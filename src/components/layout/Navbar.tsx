import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, BookOpen, User, Menu, X, Scroll, Crown, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/integrations/supabase/client';
import angelLogo from '@/assets/angel-logo.png';

// Public nav links visible to all users
const publicNavLinks = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/mini-apps', label: 'Mini Apps', icon: Sparkles },
  { path: '/cto', label: 'CTO', icon: Crown },
  { path: '/light-constitution', label: 'Hiến Pháp', icon: Scroll },
  { path: '/profile', label: 'Profile', icon: User },
];

// Admin-only nav links
const adminNavLinks = [
  { path: '/knowledge', label: 'Knowledge', icon: BookOpen },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isAuthenticated, user, session } = useUserStore();

  // Check admin role
  useEffect(() => {
    async function checkAdmin() {
      if (!session?.user?.id) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        });
        setIsAdmin(data === true);
      } catch (error) {
        setIsAdmin(false);
      }
    }
    
    checkAdmin();
  }, [session?.user?.id]);

  // Combine nav links based on role
  const navLinks = isAdmin 
    ? [...publicNavLinks, ...adminNavLinks]
    : publicNavLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-angel-gold/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src={angelLogo}
              alt="ANGEL AI"
              className="w-10 h-10 rounded-full glow-soft"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span className="font-semibold text-lg text-gradient-divine hidden sm:block">
              ANGEL AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-angel-gold/20 text-primary-foreground'
                        : 'hover:bg-angel-gold/10 text-muted-foreground'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <link.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-angel-gold/10 rounded-full">
                <span className="text-xs text-muted-foreground">✨</span>
                <span className="text-sm font-medium">{user?.light_points || 0} Light Points</span>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="divine" size="sm">
                  Đăng nhập
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-angel-gold/10"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-angel-gold/20'
                        : 'hover:bg-angel-gold/10'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
