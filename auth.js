const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { connectToDatabase, User } = require('./middleware');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();
const bcrypt = require('bcrypt');
connectToDatabase();

// Initialize passport
router.use(passport.initialize());


// Login route for AJAX request
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  console.log(identifier);

  try {
    // Find the user in the database based on username/password or email/password
    
      // Find the user with the provided username or email
      const localUser = await User.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      });
  
      if (!localUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Compare the entered password with the stored hashed password
      console.log(password);
      console.log(localUser.password);
      const passwordMatch = await bcrypt.compare(password, localUser.password);
  
      

    if (passwordMatch) {
      const token = jwt.sign({ username: localUser.username }, 'secret_key', { expiresIn: '1h' });
      res.cookie('token', token);
      console.log(token);
      return res.json({ success: true, token });
    }

    // If localUser is not found, send error response
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.clearCookie('token');
    res.redirect('https://backend-for-frontend-now.onrender.com/login');
  });
});

// Register route for AJAX request
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the user already exists in the database based on username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already taken' });
    }

    // Create a new user in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password in the database
    const newUser = new User({ username, email, password:hashedPassword });
    await newUser.save();

    // Registration successful
    console.log("Registration successful");

    return res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Google OAuth configuration
passport.use(new GoogleStrategy({
  clientID: '425263948762-6aslqkvbo0e5iup68ie06eepa982vd0e.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://backend-for-frontend-now.onrender.com/auth/google/dashboard',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in the database based on Google ID
   
      // Assuming '3' is an example Google ID, replace it with an actual ID
      const user = await User.findOne({ googleId: profile.id });
  
      if (user) {
        console.log(user);
        return done(null, user);
      } else {
        console.log('User not found');
        const newUser = new User({
          googleId: profile.id, 
          username: profile.displayName,
          // Add other necessary user details
        });
    
        await newUser.save();
        return done(null, newUser);
      }

    // If the user doesn't exist, create a new user in the database
   
  } catch (error) {
    return done(error);
  }
}));

// Google OAuth initiation route
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/dashboard',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ googleId: req.user.googleId }, 'secret_key', { expiresIn: '1h' });
    res.cookie('token', token);
    res.redirect('/dashboard');
  }
);

// Additional routes can be added as needed

module.exports = router;
