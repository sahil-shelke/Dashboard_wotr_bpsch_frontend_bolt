import { Route, Routes } from 'react-router';

import ChatInterface from './pages/ChatInterface';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';

function App() {
  return (
    <Routes>
      <Route path="/login" Component={Login} />
      <Route path="/register" Component={Register} />
      <Route path="/verify-otp" Component={VerifyOTP} />
      <Route path="/" Component={ChatInterface} />
    </Routes>
  );
}

export default App;
