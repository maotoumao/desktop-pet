import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import routes from './router';

export default function App() {
  return (
    <Router>
      <Routes>
        {routes.map((route) => (
          <Route key={route.key} path={route.path} element={route.element} />
        ))}
      </Routes>
    </Router>
  );
}
