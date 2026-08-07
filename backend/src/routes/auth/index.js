const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email = '', role: selectedRole = 'manager', mode = 'login' } = req.body || {};

  const resolvedRole = mode === 'register' ? 'customer' : (selectedRole || 'manager');
  const roleLabel = resolvedRole === 'customer' ? 'Customer' : resolvedRole === 'admin' ? 'Admin' : resolvedRole === 'manager' ? 'Manager' : resolvedRole === 'operations' ? 'Operations Officer' : resolvedRole === 'accounts' ? 'Accounts Officer' : 'Manager';

  res.json({
    success: true,
    message: mode === 'register' ? 'Registration successful' : 'Login successful',
    data: {
      user: {
        id: 1,
        name: req.body?.name || 'CPS Demo User',
        email,
        role: resolvedRole,
        roleLabel
      }
    }
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

module.exports = router;
