import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from 'src/pages/HomePage';
import NotFoundPage from './pages/NotFound';

function App() {
    return (
        <div>
            <header>
                <h1>Cocktail Bar Client</h1>
            </header>

            <hr />

            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Router>

            <hr />

            <footer>
                <p>
                    Ptolemy Henson
                </p>
            </footer>
        </div>
    );
}

export default App;
