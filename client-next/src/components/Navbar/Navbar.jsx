// src/components/Navbar/Navbar.jsx

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext'; // Adjusted import path
import styles from '../../styles/Navbar.module.css'; // Adjusted import path

const Navbar = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const updateSubmenuPosition = () => {
      const mainNavbar = document.querySelector('.navbar-default');
      const userSubmenu = document.getElementById('user-submenu');
      if (mainNavbar && userSubmenu) {
        const mainNavbarHeight = mainNavbar.offsetHeight;
        const submenuTop = getComputedStyle(document.documentElement)
          .getPropertyValue('--user-submenu-top')
          .trim();

        userSubmenu.style.top = `calc(${submenuTop} + ${
          mainNavbarHeight - parseInt(submenuTop)
        }px)`;
        document.body.style.paddingTop =
          mainNavbarHeight + userSubmenu.offsetHeight + 'px';
      }
    };

    window.addEventListener('resize', updateSubmenuPosition);
    updateSubmenuPosition();

    return () =>
      window.removeEventListener('resize', updateSubmenuPosition);
  }, []);

  return (
    <>
      <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#navbar-collapse"
              aria-expanded="false"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <Link href="/" className="navbar-brand">
              <Image
                src="/images/ValkLogo.png"
                alt="Valkyrie Logo"
                width={40}
                height={40}
                style={{ height: '100%', width: 'auto', maxHeight: '40px' }}
              />
            </Link>
          </div>

          <div className="collapse navbar-collapse" id="navbar-collapse">
            <ul className="nav navbar-nav">
              <li>
                <Link href="/">Home</Link>
              </li>
            </ul>

            <div className="nav navbar-nav navbar-right">
              <div id="auth-container">
                {user ? (
                  <button
                    onClick={logout}
                    className="btn btn-default navbar-btn"
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className="btn btn-default navbar-btn">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <nav
        id="user-submenu"
        className={`navbar navbar-inverse navbar-fixed-top hidden-xs ${styles.userSubmenu}`}
      >
        <div className="container">
          <ul className={`nav navbar-nav ${styles.navbarNav}`}>
            <li>
              <Link href="/">
                <div>
                  <i className="bi bi-house-door"></i> Home
                </div>
              </Link>
            </li>
            <li>
            <Link href="/user-profile">
                <div>
                  <i className="bi bi-person"></i> Profile
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Navbar;