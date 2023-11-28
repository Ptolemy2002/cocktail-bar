import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from 'src/pages/HomePage';
import NotFoundPage from './pages/NotFound';

function App() {
    return (
        <Router>
            <Header title="Home" />
            <main className="flex-grow-1">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}

function Header(props) {
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    function itemClass(name) {
        return currentPath === name ? "nav-item active" : "nav-item";
    }

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <Link to="#" className="navbar-brand">{props.title}</Link>
                <button 
                    className="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">
                        <li className={itemClass("/")}>
                            <Link to="/" className='nav-link'>Home <span className="visually-hidden">(current)</span></Link>
                        </li>

                        <li className={itemClass("/about")}>
                            <Link to="/about" className='nav-link'>About</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}

function Footer(props) {
    return (
        <footer className="container-fluid m-0 bg-light">
            <p>
                Ptolemy Henson
            </p>
        </footer>
    );
}

export default App;
